import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/route-auth";

export async function GET(request: NextRequest) {
  const userId = requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const contracts = await prisma.contract.findMany({
    where: { demoUserId: userId },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json(contracts);
}

export async function POST(request: NextRequest) {
  const userId = requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await request.json();

  const contract = await prisma.contract.create({
    data: {
      demoUserId: userId,
      title: data.title ?? "",
      provider: data.provider ?? "",
      category: data.category ?? "OTHER",
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      terminationDate: data.terminationDate ? new Date(data.terminationDate) : null,
      renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
      frequency: data.frequency ?? "MONTHLY",
      amount: Number(data.amount) || 0,
      status: data.status ?? "ACTIVE",
      notes: data.notes ?? null,
    },
  });

  return NextResponse.json(contract);
}
