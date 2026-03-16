import { NextRequest, NextResponse } from "next/server";
import { chatWithOllama, OllamaMessage } from "@/lib/ollama";
import { prisma } from "@/lib/prisma";
import { buildAssistantDataContext } from "@/lib/assistant-context";
import { requireUserId } from "@/lib/route-auth";

const SYSTEM_PROMPT =
  "Du bist Xeron, ein intelligenter digitaler Lebensassistent. Antworte auf Deutsch, konkret, priorisiert und handlungsorientiert. Nutze die uebergebenen Live-Daten aus der App fuer Empfehlungen, Fristen, Zahlungen und Optimierung.";

export async function POST(request: NextRequest) {
  try {
    const userId = requireUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const prompt = body.prompt?.toString().trim();
    const context = Array.isArray(body.context) ? body.context : [];
    const quickAction = body.quickAction?.toString().trim();

    if (!prompt && !quickAction) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const [contracts, subscriptions, invoices, documents] = await Promise.all([
      prisma.contract.findMany({ where: { demoUserId: userId }, orderBy: { createdAt: "desc" } }),
      prisma.subscription.findMany({ where: { demoUserId: userId }, orderBy: { createdAt: "desc" } }),
      prisma.invoice.findMany({ where: { demoUserId: userId }, orderBy: { dueDate: "asc" } }),
      prisma.document.findMany({ where: { demoUserId: userId }, orderBy: { createdAt: "desc" } }),
    ]);

    const liveContext = buildAssistantDataContext({
      contracts,
      subscriptions,
      invoices,
      documents,
    });

    const userInput = quickAction ? `${quickAction}\n\n${prompt ?? ""}` : (prompt ?? "");

    const messages: OllamaMessage[] = [
      {
        role: "system",
        content: `${SYSTEM_PROMPT}

WICHTIGE REGELN:
- Nutze immer die folgenden Live-Daten als Hauptgrundlage.
- Erstelle wenn sinnvoll einen klaren 3-Schritte-Plan.
- Nenne konkrete naechste Zahlungstermine, wenn vorhanden.
- Wenn Daten fehlen, sage genau was fehlt und wie der Nutzer es in Xeron ergaenzen kann.

LIVE APP CONTEXT (JSON):
${JSON.stringify(liveContext)}`,
      },
      ...context.slice(-8),
      { role: "user", content: userInput },
    ];

    const data = await chatWithOllama(messages);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message, message: { role: "assistant", content: "Ollama ist gerade nicht erreichbar." } },
      { status: 502 }
    );
  }
}
