import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeDocumentWithAI, extractKeyValues, guessDocumentTypeFromMeta, guessProviderFromMeta, normalizeProviderName, parseAmount, parseDate } from "@/lib/document";
import { automateFromDocument } from "@/lib/document-automation";
import { requireUserId } from "@/lib/route-auth";

type ParamsContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: ParamsContext) {
  const userId = requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const doc = await prisma.document.findFirst({
    where: { id, demoUserId: userId },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PATCH(request: NextRequest, context: ParamsContext) {
  const userId = requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const data = await request.json();
  const exists = await prisma.document.findFirst({
    where: { id, demoUserId: userId },
  });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const doc = await prisma.document.update({
    where: { id },
    data: {
      title: data.title,
      type: data.type,
      category: data.category,
      notes: data.notes,
      extractedText: data.extractedText,
      filePath: data.filePath,
      fileName: data.fileName,
      extractedAmount: data.extractedAmount,
      extractedDate: data.extractedDate ? new Date(data.extractedDate) : null,
      aiSummary: data.aiSummary,
      cancellationHint: data.cancellationHint,
    },
  });
  return NextResponse.json(doc);
}

export async function POST(request: NextRequest, context: ParamsContext) {
  const userId = requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const doc = await prisma.document.findFirst({ where: { id, demoUserId: userId } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const guessedMetaType = guessDocumentTypeFromMeta({
    title: doc.title,
    fileName: doc.fileName,
    notes: doc.notes ?? undefined,
  });

  const ai = await analyzeDocumentWithAI(doc.extractedText ?? "", {
    title: doc.title,
    fileName: doc.fileName,
    notes: doc.notes ?? undefined,
  });

  const finalType = ai.category && ai.category !== "OTHER" ? ai.category : guessedMetaType;
  const metadata = extractKeyValues(doc.extractedText ?? "");
  const parsedAmount = parseAmount(metadata.amount);
  const parsedDueDate = parseDate(metadata.dueDate);
  const parsedAnyDate = parseDate(metadata.date);
  const finalAmount =
    parsedAmount != null && (ai.amount == null || ai.amount <= 0) ? parsedAmount : ai.amount ?? parsedAmount ?? null;
  const finalDate = parsedDueDate ?? (ai.isoDate ? new Date(ai.isoDate) : parsedAnyDate);
  const updated = await prisma.document.update({
    where: { id: doc.id },
    data: {
      type: finalType,
      category: finalType,
      aiSummary: ai.summary ?? (finalType === "OTHER" ? "" : `Typ aus Dateimetadaten erkannt: ${finalType}`),
      cancellationHint: ai.cancellationHint ?? "",
      extractedAmount: finalAmount,
      extractedDate: finalDate,
    },
  });

  await automateFromDocument({
    prisma,
    userId,
    documentId: updated.id,
    type: finalType,
    title: updated.title,
    provider: normalizeProviderName(
      metadata.provider ??
        guessProviderFromMeta({
          title: updated.title,
          fileName: updated.fileName,
          notes: updated.notes ?? undefined,
        })
    ),
    amount: updated.extractedAmount ?? null,
    referenceDate: updated.extractedDate ?? null,
  });

  const result = await prisma.document.findUnique({ where: { id: updated.id } });
  return NextResponse.json(result);
}

export async function DELETE(request: NextRequest, context: ParamsContext) {
  const userId = requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const exists = await prisma.document.findFirst({
    where: { id, demoUserId: userId },
  });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
