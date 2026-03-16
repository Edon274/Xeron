import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadFile, getPublicUploadPath } from "@/lib/uploads";
import {
  analyzeDocumentWithAI,
  extractTextFromFile,
  extractKeyValues,
  guessDocumentType,
  guessDocumentTypeFromMeta,
  guessProviderFromMeta,
  parseAmount,
  parseDate,
  normalizeProviderName,
} from "@/lib/document";
import { automateFromDocument } from "@/lib/document-automation";
import { requireUserId } from "@/lib/route-auth";

export async function GET(request: NextRequest) {
  const userId = requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const documents = await prisma.document.findMany({
    where: { demoUserId: userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(documents);
}

export async function POST(request: NextRequest) {
  const userId = requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const contentType = request.headers.get("content-type") || "";

  let filePath: string | null = null;
  let fileName: string | null = null;
  let extractedText: string | null = null;
  let type = "OTHER";
  let category = "OTHER";
  let metadata: Record<string, string> = {};
  let aiSummary = "";
  let cancellationHint = "";
  let extractedAmount: number | null = null;
  let extractedDate: Date | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title")?.toString() ?? "Neue Datei";
    const notes = formData.get("notes")?.toString() ?? null;
    const rawIntentType = formData.get("intentType")?.toString()?.toUpperCase() ?? "";
    const intentType =
      rawIntentType === "INVOICE" || rawIntentType === "CONTRACT" || rawIntentType === "SUBSCRIPTION"
        ? rawIntentType
        : null;

    if (file && file instanceof File) {
      const saved = await saveUploadFile(file);
      filePath = getPublicUploadPath(saved.safeName);
      fileName = saved.fileName;
      extractedText = await extractTextFromFile(saved.path, file.type);
      type = guessDocumentType(extractedText);
      metadata = extractKeyValues(extractedText);

      const metaType = guessDocumentTypeFromMeta({
        title,
        fileName,
        notes: notes ?? undefined,
      });
      if (type === "OTHER" && metaType !== "OTHER") {
        type = metaType;
      }

      try {
        const ai = await analyzeDocumentWithAI(extractedText, {
          title,
          fileName,
          notes: notes ?? undefined,
        });
        type = ai.category || type;
        category = ai.category || category;
        aiSummary = ai.summary ?? "";
        cancellationHint = ai.cancellationHint ?? "";
        extractedAmount = ai.amount;
        extractedDate = ai.isoDate ? new Date(ai.isoDate) : null;
      } catch {
        aiSummary = metaType === "OTHER" ? "" : `Typ aus Dateiname erkannt: ${metaType}`;
      }

      const parsedAmount = parseAmount(metadata.amount);
      const parsedDueDate = parseDate(metadata.dueDate);
      const parsedAnyDate = parseDate(metadata.date);

      if (parsedAmount != null && (extractedAmount == null || extractedAmount <= 0)) {
        extractedAmount = parsedAmount;
      }
      if (parsedDueDate) {
        extractedDate = parsedDueDate;
      } else if (!extractedDate) {
        extractedDate = parsedAnyDate;
      }

      if (intentType) {
        type = intentType;
        if (category === "OTHER") category = intentType;
      }
    }

    const document = await prisma.document.create({
      data: {
        demoUserId: userId,
        title,
        type,
        fileName: fileName || "",
        filePath: filePath || "",
        extractedText,
        category,
        notes,
        extractedAmount,
        extractedDate,
        aiSummary,
        cancellationHint,
      },
    });

    const providerGuess = normalizeProviderName(
      metadata.provider ??
      guessProviderFromMeta({
        title,
        fileName: fileName ?? undefined,
        notes: notes ?? undefined,
      })
    );

    await automateFromDocument({
      prisma,
      userId,
      documentId: document.id,
      type,
      title,
      provider: providerGuess,
      amount: extractedAmount,
      referenceDate: extractedDate,
    });

    const updatedDocument = await prisma.document.findUnique({ where: { id: document.id } });
    return NextResponse.json({ document: updatedDocument, metadata });
  }

  const data = await request.json();
  const document = await prisma.document.create({
    data: {
      demoUserId: userId,
      title: data.title ?? "",
      type: data.type ?? "OTHER",
      fileName: data.fileName ?? "",
      filePath: data.filePath ?? "",
      extractedText: data.extractedText ?? "",
      category: data.category ?? "OTHER",
      notes: data.notes ?? null,
      extractedAmount: data.extractedAmount ?? null,
      extractedDate: data.extractedDate ? new Date(data.extractedDate) : null,
      aiSummary: data.aiSummary ?? "",
      cancellationHint: data.cancellationHint ?? "",
    },
  });
  return NextResponse.json(document);
}
