import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildAutomationPlan } from "@/lib/planner";
import { requireUserId } from "@/lib/route-auth";

export async function GET(request: NextRequest) {
  const userId = requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [contracts, subscriptions, invoices, documents] = await Promise.all([
    prisma.contract.findMany({ where: { demoUserId: userId } }),
    prisma.subscription.findMany({ where: { demoUserId: userId } }),
    prisma.invoice.findMany({ where: { demoUserId: userId } }),
    prisma.document.findMany({ where: { demoUserId: userId } }),
  ]);

  const plan = buildAutomationPlan({
    contracts,
    subscriptions,
    invoices,
    documents,
    now: new Date(),
  });

  return NextResponse.json(
    plan.map((item) => ({
      ...item,
      dueDate: item.dueDate.toISOString(),
    }))
  );
}
