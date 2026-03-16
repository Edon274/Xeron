import { buildAutomationPlan } from "@/lib/planner";

type AssistantInput = {
  contracts: Array<{
    title: string;
    provider: string;
    status: string;
    renewalDate: Date | null;
    terminationDate: Date | null;
  }>;
  subscriptions: Array<{
    name: string;
    provider: string;
    frequency: string;
    amount: number;
    isActive: boolean;
    renewalDate: Date | null;
    startDate: Date;
  }>;
  invoices: Array<{
    title: string;
    provider: string;
    amount: number;
    dueDate: Date;
    status: string;
  }>;
  documents: Array<{
    title: string;
    type: string;
    aiSummary: string | null;
    cancellationHint: string | null;
    extractedAmount: number | null;
    extractedDate: Date | null;
    createdAt: Date;
  }>;
};

export function buildAssistantDataContext(data: AssistantInput) {
  const monthlySubscriptions = data.subscriptions
    .filter((s) => s.isActive && s.frequency.toUpperCase().includes("MONTH"))
    .reduce((sum, s) => sum + s.amount, 0);

  const openInvoices = data.invoices.filter((i) => i.status !== "PAID");
  const overdueInvoices = data.invoices.filter((i) => i.status === "OVERDUE");

  const plan = buildAutomationPlan({
    contracts: data.contracts.map((c, idx) => ({
      id: `c-${idx}`,
      title: c.title,
      provider: c.provider,
      renewalDate: c.renewalDate,
      terminationDate: c.terminationDate,
      status: c.status,
    })),
    subscriptions: data.subscriptions.map((s, idx) => ({
      id: `s-${idx}`,
      name: s.name,
      provider: s.provider,
      frequency: s.frequency,
      startDate: s.startDate,
      renewalDate: s.renewalDate,
      amount: s.amount,
      isActive: s.isActive,
    })),
    invoices: data.invoices.map((i, idx) => ({
      id: `i-${idx}`,
      title: i.title,
      provider: i.provider,
      dueDate: i.dueDate,
      amount: i.amount,
      status: i.status,
    })),
    documents: data.documents.map((d, idx) => ({
      id: `d-${idx}`,
      title: d.title,
      createdAt: d.createdAt,
      cancellationHint: d.cancellationHint,
    })),
  });

  return {
    metrics: {
      contracts: data.contracts.length,
      subscriptions: data.subscriptions.length,
      invoices: data.invoices.length,
      documents: data.documents.length,
      monthlySubscriptions,
      openInvoices: openInvoices.length,
      overdueInvoices: overdueInvoices.length,
    },
    contracts: data.contracts.slice(0, 15),
    subscriptions: data.subscriptions.slice(0, 20),
    invoices: data.invoices.slice(0, 20),
    documents: data.documents.slice(0, 15),
    plan: plan.map((item) => ({
      ...item,
      dueDate: item.dueDate.toISOString(),
    })),
  };
}

