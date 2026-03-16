import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();

async function main() {
  await prisma.contract.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.document.deleteMany();

  const contract1 = await prisma.contract.create({
    data: {
      title: "Internet & TV",
      provider: "FiberNet GmbH",
      category: "UTILITIES",
      startDate: new Date("2024-01-15"),
      renewalDate: new Date("2026-01-15"),
      terminationDate: new Date("2025-12-15"),
      frequency: "YEARLY",
      amount: 599.99,
      status: "ACTIVE",
      notes: "Inklusive 500 Mbit/s, kündbar 3 Monate vor Ablauf",
    },
  });

  const contract2 = await prisma.contract.create({
    data: {
      title: "Hausratversicherung",
      provider: "SafeHome Versicherung",
      category: "INSURANCE",
      startDate: new Date("2023-07-01"),
      renewalDate: new Date("2026-07-01"),
      terminationDate: new Date("2026-04-01"),
      frequency: "YEARLY",
      amount: 199.0,
      status: "ACTIVE",
      notes: "Automatische Verlängerung, prüfe Tarif im Frühjahr",
    },
  });

  await prisma.subscription.create({
    data: {
      name: "Streamify Premium",
      provider: "Streamify",
      category: "SUBSCRIPTION",
      startDate: new Date("2024-02-10"),
      renewalDate: new Date("2026-02-10"),
      frequency: "MONTHLY",
      amount: 12.99,
      notes: "3 devices, Familienplan verfügbar",
      contract: { connect: { id: contract1.id } },
    },
  });

  await prisma.invoice.create({
    data: {
      title: "Stromrechnung April",
      provider: "EnergiePlus",
      amount: 87.45,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "OPEN",
      category: "UTILITIES",
      notes: "Noch nicht bezahlt",
    },
  });

  await prisma.invoice.create({
    data: {
      title: "Mobilfunk Rechnung März",
      provider: "MobileOne",
      amount: 29.99,
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: "OVERDUE",
      category: "TELECOM",
      notes: "Automatische Abbuchung aktiv",
    },
  });

  await prisma.document.createMany({
    data: [
      {
        title: "Internetvertrag FiberNet",
        type: "CONTRACT",
        fileName: "internetvertrag.pdf",
        filePath: "",
        category: "UTILITIES",
        extractedText: "FiberNet Vertrag - Laufzeit 24 Monate - Kündigungsfrist 3 Monate",
      },
      {
        title: "Stromrechnung April",
        type: "INVOICE",
        fileName: "stromrechnung-april.pdf",
        filePath: "",
        category: "UTILITIES",
        extractedText: "EnergiePlus - Betrag 87.45 EUR - Fällig am ...",
      },
    ],
  });

  console.log("✅ Seed data inserted.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
