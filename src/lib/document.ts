import fs from "fs";
import { chatWithOllama } from "@/lib/ollama";

const GENERIC_PROVIDER_TOKENS = new Set([
  "invoice",
  "rechnung",
  "vertrag",
  "contract",
  "abo",
  "subscription",
  "bill",
  "payment",
  "dokument",
  "document",
  "pdf",
  "jpg",
  "png",
  "jpeg",
  "img",
  "scan",
]);

const KNOWN_PROVIDERS = [
  "swisscom",
  "apple",
  "sunrise",
  "salt",
  "netflix",
  "spotify",
  "amazon",
  "digitec",
  "zalando",
  "galaxus",
];

export async function extractTextFromFile(filePath: string, mimeType?: string) {
  const buffer = await fs.promises.readFile(filePath);

  if (mimeType === "application/pdf" || filePath.endsWith(".pdf")) {
    try {
      const pdfParseModule = await import("pdf-parse");
      const PDFParseCtor = (pdfParseModule as unknown as { PDFParse: new (input: { data: Buffer }) => { getText: () => Promise<{ text?: string }>; destroy: () => Promise<void> } }).PDFParse;
      const parser = new PDFParseCtor({ data: buffer });
      const data = await parser.getText();
      await parser.destroy();
      return data?.text ?? "";
    } catch {
      return "";
    }
  }

  return "";
}

export function guessDocumentType(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("rechnung") || lower.includes("faellig") || lower.includes("betrag")) {
    return "INVOICE";
  }
  if (lower.includes("vertrag") || lower.includes("kuendigung") || lower.includes("verlaengerung")) {
    return "CONTRACT";
  }
  if (lower.includes("abo") || lower.includes("monat")) {
    return "SUBSCRIPTION";
  }
  return "OTHER";
}

export function guessDocumentTypeFromMeta(input: { title?: string; fileName?: string; notes?: string }) {
  const combined = `${input.title ?? ""} ${input.fileName ?? ""} ${input.notes ?? ""}`.toLowerCase();
  if (/(rechnung|invoice|bill|quittung|zahlung|faellig)/i.test(combined)) return "INVOICE";
  if (/(vertrag|contract|kuendigung|laufzeit|verlaengerung)/i.test(combined)) return "CONTRACT";
  if (/(abo|subscription|mitgliedschaft|streaming|fitness|spotify|netflix)/i.test(combined)) return "SUBSCRIPTION";
  return "OTHER";
}

export function guessProviderFromMeta(input: { title?: string; fileName?: string; notes?: string }) {
  const combined = `${input.title ?? ""} ${input.fileName ?? ""} ${input.notes ?? ""}`.trim();
  return normalizeProviderName(combined);
}

export function normalizeProviderName(value?: string | null) {
  if (!value) return "";
  const parts = value
    .replace(/\.[a-z0-9]{2,4}$/i, "")
    .split(/[\s_\-.:/\\]+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  const known = parts.find((part) => KNOWN_PROVIDERS.includes(part));
  if (known) return known;

  const candidate = parts.find(
    (part) =>
      part.length >= 3 &&
      !GENERIC_PROVIDER_TOKENS.has(part) &&
      !/^\d+$/.test(part) &&
      !/^[a-f0-9]{8,}$/i.test(part)
  );
  return candidate ?? "";
}

export function extractKeyValues(text: string) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const result: Record<string, string> = {};

  const dueDateMatch = text.match(
    /(zahlbar\s*bis|faellig(?:keitsdatum)?(?:\s*am)?|due\s*date|payment\s*due)\s*:?\s*(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}|\d{4}-\d{1,2}-\d{1,2})/i
  );
  if (dueDateMatch) {
    result.dueDate = dueDateMatch[2];
  }

  const dateMatch = text.match(/(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}|\d{4}-\d{1,2}-\d{1,2})/);
  if (dateMatch) {
    result.date = dateMatch[1];
  }

  const labeledAmountMatch = text.match(
    /(rechnungsbetrag|gesamtbetrag|total(?:betrag)?|zu\s*(?:zahlen|bezahlen)|amount\s*due|betrag)\s*:?\s*(?:chf|eur|usd)?\s*(\d{1,3}(?:[.'\s]\d{3})*(?:[.,]\d{2})|\d+[.,]\d{2})/i
  );
  if (labeledAmountMatch) {
    result.amount = labeledAmountMatch[2];
  }

  const amountMatch = text.match(/(\d{1,3}(?:[.'\s]\d{3})*(?:[.,]\d{2})|\d+[.,]\d{2})\s*(EUR|CHF|USD)?/i);
  if (amountMatch && !result.amount) {
    result.amount = amountMatch[1];
  }

  const knownProvider = text.match(/\b(swisscom|apple|sunrise|salt|netflix|spotify|amazon|digitec|zalando)\b/i);
  if (knownProvider) {
    result.provider = normalizeProviderName(knownProvider[1]);
  }

  const providerLine = lines.find((line) => /gmbh|ag|service|energie|versicherung|telecom|mobile|internet/i.test(line));
  if (providerLine) {
    result.provider = result.provider ?? normalizeProviderName(providerLine);
  }

  return result;
}

export function parseAmount(value?: string | null) {
  if (!value) return null;
  let cleaned = value
    .replace(/[^0-9,.'-]/g, "")
    .replace(/'/g, "")
    .trim();
  if (!cleaned) return null;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (lastComma >= 0) {
    cleaned = cleaned.replace(",", ".");
  }

  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : null;
}

export function parseDate(value?: string | null) {
  if (!value) return null;

  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(value)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const m = value.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]) - 1;
  const yearRaw = Number(m[3]);
  const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
  const d = new Date(year, month, day);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function analyzeDocumentWithAI(text: string, meta?: { title?: string; fileName?: string; notes?: string }) {
  const fallbackType = guessDocumentTypeFromMeta(meta ?? {});

  if (!text.trim()) {
    return {
      category: fallbackType,
      summary: fallbackType === "OTHER" ? "" : `Typ aus Dateimetadaten erkannt: ${fallbackType}`,
      cancellationHint: "",
      amount: null as number | null,
      isoDate: null as string | null,
    };
  }

  const prompt = `Analysiere das folgende Dokument und antworte nur als JSON.
Schema:
{
  "category": "CONTRACT|SUBSCRIPTION|INVOICE|OTHER",
  "summary": "kurze Zusammenfassung auf Deutsch",
  "cancellationHint": "Kuendigungs- oder Fristenhinweis, falls vorhanden",
  "amount": number|null,
  "isoDate": "YYYY-MM-DD"|null
}

Text:
${text.slice(0, 12000)}

Datei-Metadaten:
${JSON.stringify(meta ?? {})}`;

  const data = await chatWithOllama([{ role: "user", content: prompt }]);
  const content = data?.message?.content ?? "";

  try {
    const jsonStart = content.indexOf("{");
    const jsonEnd = content.lastIndexOf("}");
    const raw = jsonStart >= 0 && jsonEnd >= 0 ? content.slice(jsonStart, jsonEnd + 1) : "{}";
    const parsed = JSON.parse(raw);

    return {
      category: parsed.category ?? fallbackType,
      summary: parsed.summary ?? "",
      cancellationHint: parsed.cancellationHint ?? "",
      amount: typeof parsed.amount === "number" ? parsed.amount : null,
      isoDate: typeof parsed.isoDate === "string" ? parsed.isoDate : null,
    };
  } catch {
    const textGuess = guessDocumentType(text);
    return {
      category: textGuess === "OTHER" ? fallbackType : textGuess,
      summary: "",
      cancellationHint: "",
      amount: null,
      isoDate: null,
    };
  }
}
