type ContractLike = {
  id: string;
  title: string;
  provider: string;
  renewalDate: Date | null;
  terminationDate: Date | null;
  status: string;
};

type SubscriptionLike = {
  id: string;
  name: string;
  provider: string;
  frequency: string;
  startDate: Date;
  renewalDate: Date | null;
  amount: number;
  isActive: boolean;
};

type InvoiceLike = {
  id: string;
  title: string;
  provider: string;
  dueDate: Date;
  amount: number;
  status: string;
};

type DocumentLike = {
  id: string;
  title: string;
  createdAt: Date;
  cancellationHint: string | null;
};

export type PlanItem = {
  id: string;
  kind: "invoice" | "subscription" | "contract" | "document";
  title: string;
  dueDate: Date;
  description: string;
  priority: "high" | "medium" | "low";
};

function daysBetween(a: Date, b: Date) {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function frequencyInMonths(freq: string) {
  const value = freq.toUpperCase();
  if (value.includes("YEAR")) return 12;
  if (value.includes("QUARTER")) return 3;
  return 1;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function getNextSubscriptionCharge(sub: SubscriptionLike, now: Date) {
  if (!sub.isActive) return null;
  if (sub.renewalDate && sub.renewalDate >= now) return sub.renewalDate;
  const step = frequencyInMonths(sub.frequency);
  let next = new Date(sub.startDate);
  while (next < now) {
    next = addMonths(next, step);
  }
  return next;
}

export function buildAutomationPlan({
  contracts,
  subscriptions,
  invoices,
  documents,
  now = new Date(),
}: {
  contracts: ContractLike[];
  subscriptions: SubscriptionLike[];
  invoices: InvoiceLike[];
  documents: DocumentLike[];
  now?: Date;
}) {
  const plan: PlanItem[] = [];

  for (const invoice of invoices) {
    if (invoice.status === "PAID") continue;
    const days = daysBetween(invoice.dueDate, now);
    if (days <= 45) {
      plan.push({
        id: `invoice-${invoice.id}`,
        kind: "invoice",
        title: `Rechnung faellig: ${invoice.title}`,
        dueDate: invoice.dueDate,
        description: `${invoice.provider} - ${invoice.amount.toFixed(2)} EUR`,
        priority: days < 0 ? "high" : days <= 7 ? "high" : "medium",
      });
    }
  }

  for (const sub of subscriptions) {
    const next = getNextSubscriptionCharge(sub, now);
    if (!next) continue;
    const days = daysBetween(next, now);
    if (days <= 45) {
      plan.push({
        id: `sub-${sub.id}`,
        kind: "subscription",
        title: `Naechste Abbuchung: ${sub.name}`,
        dueDate: next,
        description: `${sub.provider} - ${sub.amount.toFixed(2)} EUR (${sub.frequency})`,
        priority: days <= 7 ? "high" : "medium",
      });
    }
  }

  for (const contract of contracts) {
    const contractDate = contract.terminationDate ?? contract.renewalDate;
    if (!contractDate) continue;
    const days = daysBetween(contractDate, now);
    if (days <= 60) {
      plan.push({
        id: `contract-${contract.id}`,
        kind: "contract",
        title: `Vertrag pruefen: ${contract.title}`,
        dueDate: contractDate,
        description: `${contract.provider} - Status ${contract.status}`,
        priority: days <= 14 ? "high" : "medium",
      });
    }
  }

  for (const doc of documents) {
    if (!doc.cancellationHint) continue;
    plan.push({
      id: `doc-${doc.id}`,
      kind: "document",
      title: `Dokumenthinweis: ${doc.title}`,
      dueDate: doc.createdAt,
      description: doc.cancellationHint,
      priority: "low",
    });
  }

  return plan.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()).slice(0, 14);
}

