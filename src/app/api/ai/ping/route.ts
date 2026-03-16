import { NextResponse } from "next/server";
import { checkOllama } from "@/lib/ollama";

export async function GET() {
  try {
    const status = await checkOllama();
    if (!status.ok) {
      return NextResponse.json({ ok: false, status: status.status }, { status: 502 });
    }
    return NextResponse.json({ ok: true, models: status.payload });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 502 });
  }
}
