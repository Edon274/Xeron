"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Subscription = {
  id: string;
  name: string;
  provider: string;
  frequency: string;
  amount: number;
  renewalDate?: string | null;
  isActive: boolean;
  category: string;
  notes?: string | null;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("de-DE");
}

export function SubscriptionList() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [form, setForm] = useState({
    name: "",
    provider: "",
    frequency: "MONTHLY",
    amount: "",
    renewalDate: "",
    isActive: true,
    category: "SUBSCRIPTION",
    notes: "",
  });

  async function load() {
    const res = await fetch("/api/subscriptions");
    const data = await res.json();
    setSubscriptions(data);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return subscriptions.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.provider.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [subscriptions, search]);

  async function handleCreate() {
    await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        provider: form.provider,
        frequency: form.frequency,
        amount: Number(form.amount),
        renewalDate: form.renewalDate || null,
        isActive: form.isActive,
        category: form.category,
        notes: form.notes,
        startDate: new Date().toISOString().slice(0, 10),
      }),
    });
    setOpen(false);
    setForm({
      name: "",
      provider: "",
      frequency: "MONTHLY",
      amount: "",
      renewalDate: "",
      isActive: true,
      category: "SUBSCRIPTION",
      notes: "",
    });
    await load();
  }

  async function handleUpdate() {
    if (!editing) return;
    await fetch(`/api/subscriptions/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        provider: form.provider,
        frequency: form.frequency,
        amount: Number(form.amount),
        renewalDate: form.renewalDate || null,
        isActive: form.isActive,
        category: form.category,
        notes: form.notes,
      }),
    });
    setOpen(false);
    setEditing(null);
    setForm({
      name: "",
      provider: "",
      frequency: "MONTHLY",
      amount: "",
      renewalDate: "",
      isActive: true,
      category: "SUBSCRIPTION",
      notes: "",
    });
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Abo wirklich loeschen?")) return;
    await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
    await load();
  }

  async function handleUploadToAI() {
    if (!uploadFile) return;
    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("title", uploadTitle || uploadFile.name);
    fd.append("notes", uploadNotes);
    fd.append("intentType", "SUBSCRIPTION");
    await fetch("/api/documents", { method: "POST", body: fd });
    setUploadFile(null);
    setUploadTitle("");
    setUploadNotes("");
    setOpen(false);
    await load();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Abos</h1>
          <p className="text-sm text-muted-foreground">Verwalte monatliche und jaehrliche Abonnements mit Verlaengerung.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input placeholder="Suchen..." value={search} onChange={(event) => setSearch(event.target.value)} className="max-w-xs" />
          <Dialog
            open={open}
            onOpenChange={(value) => {
              setOpen(value);
              if (!value) setEditing(null);
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditing(null);
                  setForm({
                    name: "",
                    provider: "",
                    frequency: "MONTHLY",
                    amount: "",
                    renewalDate: "",
                    isActive: true,
                    category: "SUBSCRIPTION",
                    notes: "",
                  });
                }}
              >
                Neues Abo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Abo bearbeiten" : "Abo hinzufuegen"}</DialogTitle>
                <DialogDescription>Fuege ein monatliches oder jaehrliches Abo mit Kosten und Verlaengerung hinzu.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                {!editing ? (
                  <div className="rounded-xl border border-border/70 bg-white/60 p-3 space-y-2">
                    <p className="text-sm font-medium">KI Upload (automatisch analysieren)</p>
                    <Input
                      placeholder="Upload Titel (optional)"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                    />
                    <Input type="file" accept=".pdf,image/*" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
                    <Input
                      placeholder="Notiz (optional)"
                      value={uploadNotes}
                      onChange={(e) => setUploadNotes(e.target.value)}
                    />
                    <Button variant="secondary" onClick={handleUploadToAI} disabled={!uploadFile}>
                      Mit KI hochladen
                    </Button>
                  </div>
                ) : null}
                <Input placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                <Input placeholder="Anbieter" value={form.provider} onChange={(e) => setForm((p) => ({ ...p, provider: e.target.value }))} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input placeholder="MONTHLY oder YEARLY" value={form.frequency} onChange={(e) => setForm((p) => ({ ...p, frequency: e.target.value }))} />
                  <Input type="number" step="0.01" placeholder="Betrag" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
                  <Input type="date" value={form.renewalDate} onChange={(e) => setForm((p) => ({ ...p, renewalDate: e.target.value }))} />
                </div>
                <Input placeholder="Kategorie" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
                <Input placeholder="Notizen" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={editing ? handleUpdate : handleCreate}>{editing ? "Aktualisieren" : "Speichern"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Anbieter</TableHead>
            <TableHead>Kosten</TableHead>
            <TableHead>Intervall</TableHead>
            <TableHead>Naechste Verlaengerung</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.provider}</TableCell>
              <TableCell>{formatMoney(item.amount)}</TableCell>
              <TableCell>{item.frequency}</TableCell>
              <TableCell>{formatDate(item.renewalDate)}</TableCell>
              <TableCell>
                <Badge variant={item.isActive ? "secondary" : "outline"}>{item.isActive ? "aktiv" : "inaktiv"}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(item);
                      setForm({
                        name: item.name ?? "",
                        provider: item.provider ?? "",
                        frequency: item.frequency ?? "MONTHLY",
                        amount: String(item.amount ?? ""),
                        renewalDate: item.renewalDate ? new Date(item.renewalDate).toISOString().slice(0, 10) : "",
                        isActive: item.isActive,
                        category: item.category ?? "SUBSCRIPTION",
                        notes: item.notes ?? "",
                      });
                      setOpen(true);
                    }}
                  >
                    Bearbeiten
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                    Loeschen
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
