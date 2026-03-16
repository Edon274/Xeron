import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/route-auth";

export async function GET(request: NextRequest) {
  const userId = requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const subscriptions = await prisma.subscription.findMany({
    where: { demoUserId: userId },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json(subscriptions);
}

export async function POST(request: NextRequest) {
  const userId = requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await request.json();
  const subscription = await prisma.subscription.create({
    data: {
      demoUserId: userId,
      name: data.name ?? "",
      provider: data.provider ?? "",
      category: data.category ?? "SUBSCRIPTION",
      startDate: new Date(data.startDate),
      renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
      frequency: data.frequency ?? "MONTHLY",
      amount: Number(data.amount) || 0,
      isActive: data.isActive ?? true,
      notes: data.notes ?? null,
      contractId: data.contractId ?? null,
    },
  });
  return NextResponse.json(subscription);
}
