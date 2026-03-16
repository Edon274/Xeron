const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3";

export type OllamaMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function chatWithOllama(messages: OllamaMessage[]) {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama error ${response.status}: ${errorText}`);
  }

  return response.json();
}

export async function checkOllama() {
  const response = await fetch(`${OLLAMA_URL}/api/tags`);
  if (!response.ok) {
    return { ok: false, status: response.status };
  }
  const payload = await response.json();
  return { ok: true, payload };
}

