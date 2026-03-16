"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

const QUICK_ACTIONS = [
  "Wie fuege ich einen Vertrag hinzu?",
  "Erstelle mir einen Plan fuer die naechsten 30 Tage.",
  "Welche Zahlungen stehen als naechstes an?",
  "Wo sehe ich meine Fixkosten?",
  "Welche Vertraege laufen bald aus?",
  "Wo kann ich sparen?",
];

export function AIChat({ compact = false }: { compact?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ollamaOk, setOllamaOk] = useState(false);
  const [ollamaError, setOllamaError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function checkOllama() {
      try {
        const res = await fetch("/api/ai/ping");
        const data = await res.json();
        setOllamaOk(data.ok);
        setOllamaError(data.ok ? null : data.error ?? `Status ${data.status}`);
      } catch (error) {
        setOllamaOk(false);
        setOllamaError((error as Error).message);
      }
    }
    checkOllama();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function sendMessage(quickAction?: string) {
    const text = quickAction ?? input;
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          quickAction: quickAction ?? null,
          context: messages.slice(-6),
        }),
      });

      const data = await res.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data?.message?.content || data?.error || "Keine Antwort erhalten.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Fehler: ${(error as Error).message}. Pruefe, ob Ollama laeuft.` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      <header>
        <h1 className={compact ? "text-lg font-semibold" : "text-3xl font-semibold tracking-tight"}>KI-Assistent</h1>
        {!compact && (
          <p className="text-sm text-muted-foreground">
            Stelle Fragen zu Vertraegen, Rechnungen, Dokumenten und Sparpotenzial.
          </p>
        )}
      </header>

      {!ollamaOk && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Ollama nicht verfuegbar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Starte lokal: <code>ollama serve</code> und lade ein Modell wie <code>llama3</code>.
            </p>
            {ollamaError ? <p className="mt-2 text-sm text-destructive">Fehler: {ollamaError}</p> : null}
          </CardContent>
        </Card>
      )}

      <Card
        className={
          compact
            ? "glass-card flex h-[72vh] max-h-[680px] min-h-[460px] flex-col overflow-hidden"
            : "glass-card flex h-[78vh] min-h-[620px] flex-col overflow-hidden"
        }
      >
        <CardHeader>
          <CardTitle>Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Button key={action} variant="outline" size="sm" onClick={() => sendMessage(action)} disabled={!ollamaOk || loading}>
                {action}
              </Button>
            ))}
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-xl border border-border/70 bg-white/70 p-3 pr-2">
            {messages.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>Frag mich alles zu deinem digitalen Leben.</p>
              </div>
            ) : null}

            {messages.map((msg, i) => (
              <div key={`${msg.role}-${i}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[84%] rounded-xl px-4 py-2 text-sm leading-relaxed ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading ? (
              <div className="flex justify-start">
                <div className="rounded-xl bg-muted px-4 py-2 text-sm">Xeron denkt nach...</div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Deine Frage..."
              disabled={!ollamaOk || loading}
            />
            <Button onClick={() => sendMessage()} disabled={!ollamaOk || loading || !input.trim()}>
              Senden
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
