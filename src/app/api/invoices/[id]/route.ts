import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/route-auth";

type ParamsContext = { params: Promise<{ id: string }> };

function parseInvoiceDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: NextRequest, context: ParamsContext) {
  const userId = requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, demoUserId: userId },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(invoice);
}

export async function PATCH(request: NextRequest, context: ParamsContext) {
  const userId = requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const data = await request.json();
  const exists = await prisma.invoice.findFirst({ where: { id, demoUserId: userId } });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const dueDate = data.dueDate ? parseInvoiceDate(data.dueDate) : undefined;
  if (data.dueDate && !dueDate) {
    return NextResponse.json({ error: "Ungueltiges Faelligkeitsdatum." }, { status: 400 });
  }
  const dueDateUpdate = dueDate ?? undefined;

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      title: data.title,
      provider: data.provider,
      amount: data.amount ? Number(data.amount) : undefined,
      dueDate: dueDateUpdate,
      status: data.status,
      category: data.category,
      notes: data.notes,
      filePath: data.filePath,
    },
  });
  return NextResponse.json(invoice);
}

export async function DELETE(request: NextRequest, context: ParamsContext) {
  const userId = requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const exists = await prisma.invoice.findFirst({ where: { id, demoUserId: userId } });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
