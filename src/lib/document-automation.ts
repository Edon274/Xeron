import { PrismaClient } from "@prisma/client";
import { normalizeProviderName } from "@/lib/document";

export async function automateFromDocument({
  prisma,
  userId,
  documentId,
  type,
  title,
  provider,
  amount,
  referenceDate,
}: {
  prisma: PrismaClient;
  userId: string;
  documentId: string;
  type: string;
  title: string;
  provider: string;
  amount: number | null;
  referenceDate: Date | null;
}) {
  const normalized = type.toUpperCase();
  const normalizedProvider = normalizeProviderName(provider);
  const safeProvider = normalizedProvider || "Unbekannt";
  const safeAmount = typeof amount === "number" && Number.isFinite(amount) ? amount : null;
  const safeDate = referenceDate ?? null;
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { linkedInvoiceId: true, linkedContractId: true, linkedSubscriptionId: true },
  });

  if (normalized === "INVOICE") {
    if (doc?.linkedInvoiceId) {
      const existing = await prisma.invoice.findUnique({ where: { id: doc.linkedInvoiceId } });
      const shouldApplyAmount =
        safeAmount != null && (safeAmount > 0 || (existing?.amount ?? 0) <= 0);
      await prisma.invoice.update({
        where: { id: doc.linkedInvoiceId },
        data: {
          title: title || undefined,
          provider: normalizedProvider || undefined,
          amount: shouldApplyAmount ? safeAmount! : undefined,
          dueDate: safeDate ?? undefined,
          category: "AUTO_IMPORT",
        },
      });
      return;
    }
    const invoice = await prisma.invoice.create({
      data: {
        demoUserId: userId,
        title: title || "Rechnung aus Dokument",
        provider: safeProvider,
        amount: safeAmount ?? 0,
        dueDate: safeDate ?? new Date(),
        status: "OPEN",
        category: "AUTO_IMPORT",
      },
    });

    await prisma.document.update({
      where: { id: documentId },
      data: { linkedInvoiceId: invoice.id },
    });
    return;
  }

  if (normalized === "CONTRACT") {
    if (doc?.linkedContractId) {
      const existing = await prisma.contract.findUnique({ where: { id: doc.linkedContractId } });
      const shouldApplyAmount =
        safeAmount != null && (safeAmount > 0 || (existing?.amount ?? 0) <= 0);
      await prisma.contract.update({
        where: { id: doc.linkedContractId },
        data: {
          title: title || undefined,
          provider: normalizedProvider || undefined,
          amount: shouldApplyAmount ? safeAmount! : undefined,
          renewalDate: safeDate ?? undefined,
        },
      });
      return;
    }
    const contract = await prisma.contract.create({
      data: {
        demoUserId: userId,
        title: title || "Vertrag aus Dokument",
        provider: safeProvider,
        category: "AUTO_IMPORT",
        startDate: safeDate ?? new Date(),
        renewalDate: safeDate ?? new Date(),
        frequency: "MONTHLY",
        amount: safeAmount ?? 0,
        status: "ACTIVE",
      },
    });

    await prisma.document.update({
      where: { id: documentId },
      data: { linkedContractId: contract.id },
    });
    return;
  }

  if (normalized === "SUBSCRIPTION") {
    if (doc?.linkedSubscriptionId) {
      const existing = await prisma.subscription.findUnique({ where: { id: doc.linkedSubscriptionId } });
      const shouldApplyAmount =
        safeAmount != null && (safeAmount > 0 || (existing?.amount ?? 0) <= 0);
      await prisma.subscription.update({
        where: { id: doc.linkedSubscriptionId },
        data: {
          name: title || undefined,
          provider: normalizedProvider || undefined,
          amount: shouldApplyAmount ? safeAmount! : undefined,
          renewalDate: safeDate ?? undefined,
        },
      });
      return;
    }
    const subscription = await prisma.subscription.create({
      data: {
        demoUserId: userId,
        name: title || "Abo aus Dokument",
        provider: safeProvider,
        category: "AUTO_IMPORT",
        startDate: safeDate ?? new Date(),
        renewalDate: safeDate ?? new Date(),
        frequency: "MONTHLY",
        amount: safeAmount ?? 0,
        isActive: true,
      },
    });

    await prisma.document.update({
      where: { id: documentId },
      data: { linkedSubscriptionId: subscription.id },
    });
  }
}
