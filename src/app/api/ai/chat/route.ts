import { NextRequest, NextResponse } from "next/server";
import { chatWithOllama, OllamaMessage } from "@/lib/ollama";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const prompt = body.prompt;
  const context = body.context ?? [];

  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  const systemPrompt =
    "Du bist Xeron, der digitale Assistent. Du hilfst bei Vertraegen, Abos, Rechnungen und Dokumenten. Antworte knapp und handlungsorientiert.";

  const messages: OllamaMessage[] = [
    { role: "system", content: systemPrompt },
    ...context,
    { role: "user", content: prompt },
  ];

  try {
    const data = await chatWithOllama(messages);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        message: {
          role: "assistant",
          content:
            "Ich kann gerade nicht auf Ollama zugreifen. Starte Ollama (ollama serve) fuer echte Antworten.",
        },
        error: (error as Error).message,
      },
      { status: 502 }
    );
  }
}

