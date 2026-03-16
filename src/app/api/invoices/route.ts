import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/route-auth";

function parseInvoiceDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: NextRequest) {
  const userId = requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const invoices = await prisma.invoice.findMany({
    where: { demoUserId: userId },
    orderBy: { dueDate: "asc" },
  });
  return NextResponse.json(invoices);
}

export async function POST(request: NextRequest) {
  const userId = requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await request.json();
  const dueDate = parseInvoiceDate(data.dueDate);
  if (!dueDate) {
    return NextResponse.json({ error: "Ungueltiges Faelligkeitsdatum." }, { status: 400 });
  }

  const amount = Number(data.amount);
  const invoice = await prisma.invoice.create({
    data: {
      demoUserId: userId,
      title: data.title ?? "",
      provider: data.provider ?? "",
      amount: Number.isFinite(amount) ? amount : 0,
      dueDate,
      status: data.status ?? "OPEN",
      category: data.category ?? "OTHER",
      notes: data.notes ?? null,
      filePath: data.filePath ?? null,
    },
  });

  return NextResponse.json(invoice);
}
