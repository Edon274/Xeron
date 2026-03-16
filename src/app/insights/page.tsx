import { prisma } from "@/lib/prisma";
import { requireServerUserId } from "@/lib/server-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export default async function InsightsPage() {
  const userId = await requireServerUserId();
  const now = new Date();
  const [contracts, subscriptions, invoices] = await Promise.all([
    prisma.contract.findMany({ where: { demoUserId: userId } }),
    prisma.subscription.findMany({ where: { demoUserId: userId } }),
    prisma.invoice.findMany({ where: { demoUserId: userId } }),
  ]);

  const totalMonthly = subscriptions.filter((s) => s.isActive).reduce((sum, s) => sum + s.amount, 0);
  const totalYearly = contracts.filter((c) => c.status === "ACTIVE").reduce((sum, c) => sum + c.amount, 0);
  const overdueInvoices = invoices.filter((i) => i.status === "OVERDUE");

  const upcomingRenewals = contracts
    .filter((c) => c.renewalDate)
    .map((c) => ({
      ...c,
      daysUntil: Math.floor((new Date(c.renewalDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }))
    .filter((c) => c.daysUntil >= 0 && c.daysUntil <= 60)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  const savingHints = [
    totalMonthly > 180 ? "Abo-Kosten sind hoch. Pruefe jaehrliche Zahlungsmodelle fuer Rabatte." : "Abo-Kosten wirken stabil.",
    overdueInvoices.length > 0 ? "Offene ueberfaellige Rechnungen priorisieren, um Mahnkosten zu vermeiden." : "Keine Mahnrisiken erkannt.",
    upcomingRenewals.length > 0
      ? "Vor Verlaengerung pruefen, ob die Leistung noch benoetigt wird."
      : "Keine kurzfristigen Verlaengerungen erkannt.",
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Insights</h1>
        <p className="text-sm text-muted-foreground">Analyse deiner Ausgaben und intelligente Hinweise zum Sparen.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Monatliche Fixkosten</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatMoney(totalMonthly)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Jaehrliche Vertragskosten</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatMoney(totalYearly)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Ueberfaellige Rechnungen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{overdueInvoices.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Baldige Verlaengerungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingRenewals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine nahen Verlaengerungen.</p>
            ) : (
              <ul className="space-y-2">
                {upcomingRenewals.map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded-xl border border-border/70 bg-white/70 p-3">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.renewalDate!), "dd.MM.yyyy")} ({item.daysUntil} Tage)
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{formatMoney(item.amount)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>KI Sparpotenzial</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {savingHints.map((hint) => (
                <li key={hint} className="rounded-xl border border-border/70 bg-white/70 p-3 text-sm">
                  {hint}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

