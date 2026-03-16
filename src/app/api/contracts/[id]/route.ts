import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/route-auth";

type ParamsContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: ParamsContext) {
  const userId = requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const contract = await prisma.contract.findFirst({ where: { id, demoUserId: userId } });
  if (!contract) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(contract);
}

export async function PATCH(request: NextRequest, context: ParamsContext) {
  const userId = requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const data = await request.json();
  const exists = await prisma.contract.findFirst({ where: { id, demoUserId: userId } });
  if (!exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contract = await prisma.contract.update({
    where: { id },
    data: {
      title: data.title,
      provider: data.provider,
      category: data.category,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : null,
      terminationDate: data.terminationDate ? new Date(data.terminationDate) : null,
      renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
      frequency: data.frequency,
      amount: data.amount ? Number(data.amount) : undefined,
      status: data.status,
      notes: data.notes,
    },
  });
  return NextResponse.json(contract);
}

export async function DELETE(request: NextRequest, context: ParamsContext) {
  const userId = requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const exists = await prisma.contract.findFirst({ where: { id, demoUserId: userId } });
  if (!exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.contract.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
