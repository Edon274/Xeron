import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/route-auth";

type ParamsContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: ParamsContext) {
  const userId = requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const subscription = await prisma.subscription.findFirst({
    where: { id, demoUserId: userId },
  });
  if (!subscription) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(subscription);
}

export async function PATCH(request: NextRequest, context: ParamsContext) {
  const userId = requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const data = await request.json();
  const exists = await prisma.subscription.findFirst({
    where: { id, demoUserId: userId },
  });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const subscription = await prisma.subscription.update({
    where: { id },
    data: {
      name: data.name,
      provider: data.provider,
      category: data.category,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
      frequency: data.frequency,
      amount: data.amount ? Number(data.amount) : undefined,
      isActive: data.isActive,
      notes: data.notes,
      contractId: data.contractId ?? null,
    },
  });
  return NextResponse.json(subscription);
}

export async function DELETE(request: NextRequest, context: ParamsContext) {
  const userId = requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const exists = await prisma.subscription.findFirst({
    where: { id, demoUserId: userId },
  });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.subscription.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
