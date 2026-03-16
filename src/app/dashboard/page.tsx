import { prisma } from "@/lib/prisma";
import { requireServerUserId } from "@/lib/server-auth";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { buildAutomationPlan } from "@/lib/planner";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export default async function DashboardPage() {
  const userId = await requireServerUserId();
  const now = new Date();
  const [contracts, subscriptions, invoices, documents] = await Promise.all([
    prisma.contract.findMany({ where: { demoUserId: userId }, orderBy: { startDate: "desc" } }),
    prisma.subscription.findMany({ where: { demoUserId: userId }, orderBy: { startDate: "desc" } }),
    prisma.invoice.findMany({ where: { demoUserId: userId }, orderBy: { dueDate: "asc" } }),
    prisma.document.findMany({ where: { demoUserId: userId }, orderBy: { createdAt: "desc" } }),
  ]);

  const activeContracts = contracts.filter(
    (c) => c.status === "ACTIVE" || c.status === "RENEWING_SOON" || c.status === "ENDS_SOON"
  );
  const openInvoices = invoices.filter((i) => i.status === "OPEN");
  const overdueInvoices = invoices.filter((i) => i.status === "OVERDUE");
  const monthlyCosts = subscriptions
    .filter((s) => s.frequency === "MONTHLY" && s.isActive)
    .reduce((sum, s) => sum + s.amount, 0);

  const upcomingContracts = contracts
    .filter((c) => c.renewalDate)
    .filter((c) => {
      const days = (c.renewalDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return days >= 0 && days <= 30;
    });

  const automationPlan = buildAutomationPlan({
    contracts,
    subscriptions,
    invoices,
    documents,
    now,
  });

  const recommendations = [
    upcomingContracts.length > 0
      ? `${upcomingContracts.length} Vertrag/Vertraege verlaengern sich bald.`
      : "Keine nahen Verlaengerungen in den naechsten 30 Tagen.",
    overdueInvoices.length > 0
      ? `${overdueInvoices.length} Rechnung/Rechnungen sind ueberfaellig.`
      : "Aktuell sind keine Rechnungen ueberfaellig.",
    monthlyCosts > 150
      ? "Deine monatlichen Fixkosten sind hoch. Pruefe die teuersten Abos in Insights."
      : "Fixkosten sind aktuell im stabilen Bereich.",
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-base text-muted-foreground">
            Ueberblick ueber deine Vertraege, Abos, Rechnungen und KI-Hinweise.
          </p>
        </div>
      </header>

      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
        <Card className="glass-card min-h-40">
          <CardHeader>
            <CardTitle className="text-base">Monatliche Fixkosten</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{formatMoney(monthlyCosts)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card min-h-40">
          <CardHeader>
            <CardTitle className="text-base">Aktive Vertraege</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{activeContracts.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card min-h-40">
          <CardHeader>
            <CardTitle className="text-base">Bald endend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{upcomingContracts.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card min-h-40">
          <CardHeader>
            <CardTitle className="text-base">Neue Rechnungen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{openInvoices.length}</p>
            <p className="text-base text-muted-foreground">Ueberfaellig: {overdueInvoices.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="glass-card min-h-72">
          <CardHeader>
            <CardTitle className="text-xl">Baldige Verlaengerungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingContracts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine Vertraege in den naechsten 30 Tagen.</p>
            ) : (
              <ul className="space-y-2">
                {upcomingContracts.slice(0, 4).map((contract) => (
                  <li
                    key={contract.id}
                    className="flex items-start justify-between gap-2 rounded-xl border border-border/70 bg-white/70 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{contract.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Verlaengerung: {contract.renewalDate ? format(new Date(contract.renewalDate), "dd.MM.yyyy") : "-"}
                      </p>
                    </div>
                    <Badge variant="secondary">{contract.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/contracts" className="text-sm font-medium text-primary hover:underline">
              Zur Vertragsuebersicht
            </Link>
          </CardContent>
        </Card>

        <Card className="glass-card min-h-72">
          <CardHeader>
            <CardTitle className="text-xl">KI Empfehlungen</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((tip) => (
                <li key={tip} className="rounded-xl border border-border/70 bg-white/70 p-3 text-sm">
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl">Automations-Plan (naechste Schritte)</CardTitle>
        </CardHeader>
        <CardContent>
          {automationPlan.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Aufgaben erkannt. Lade Dokumente hoch oder fuege Vertraege/Abos/Rechnungen hinzu.
            </p>
          ) : (
            <ul className="space-y-2">
              {automationPlan.slice(0, 8).map((item) => (
                <li key={item.id} className="rounded-xl border border-border/70 bg-white/70 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{format(item.dueDate, "dd.MM.yyyy")}</p>
                      <Badge variant={item.priority === "high" ? "destructive" : "secondary"}>{item.priority}</Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
