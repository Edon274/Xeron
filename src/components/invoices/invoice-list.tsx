"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Invoice = {
  id: string;
  title: string;
  provider: string;
  amount: number;
  dueDate: string;
  status: string;
  category: string;
  notes?: string | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleDateString("de-DE");
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [form, setForm] = useState({
    title: "",
    provider: "",
    amount: "",
    dueDate: new Date().toISOString().slice(0, 10),
    status: "OPEN",
    category: "OTHER",
    notes: "",
  });
  const [manualError, setManualError] = useState("");

  async function load() {
    const res = await fetch("/api/invoices");
    const data = await res.json();
    setInvoices(data);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter(
      (invoice) =>
        invoice.title.toLowerCase().includes(q) ||
        invoice.provider.toLowerCase().includes(q) ||
        invoice.category.toLowerCase().includes(q)
    );
  }, [invoices, search]);

  async function handleCreate() {
    setManualError("");
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        provider: form.provider,
        amount: Number(form.amount),
        dueDate: form.dueDate,
        status: form.status,
        category: form.category,
        notes: form.notes,
      }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setManualError(payload.error ?? "Speichern fehlgeschlagen.");
      return;
    }
    setOpen(false);
    setForm({
      title: "",
      provider: "",
      amount: "",
      dueDate: new Date().toISOString().slice(0, 10),
      status: "OPEN",
      category: "OTHER",
      notes: "",
    });
    await load();
  }

  async function handleUpdate() {
    if (!editing) return;
    setManualError("");
    const res = await fetch(`/api/invoices/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        provider: form.provider,
        amount: Number(form.amount),
        dueDate: form.dueDate,
        status: form.status,
        category: form.category,
        notes: form.notes,
      }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setManualError(payload.error ?? "Aktualisieren fehlgeschlagen.");
      return;
    }
    setEditing(null);
    setOpen(false);
    setForm({
      title: "",
      provider: "",
      amount: "",
      dueDate: new Date().toISOString().slice(0, 10),
      status: "OPEN",
      category: "OTHER",
      notes: "",
    });
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Rechnung wirklich loeschen?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    await load();
  }

  async function handleUploadToAI() {
    if (!uploadFile) return;
    setManualError("");
    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("title", uploadTitle || uploadFile.name);
    fd.append("notes", uploadNotes);
    fd.append("intentType", "INVOICE");
    await fetch("/api/documents", { method: "POST", body: fd });
    setUploadFile(null);
    setUploadTitle("");
    setUploadNotes("");
    setOpen(false);
    await load();
  }

  const canSaveManual = form.title.trim().length > 0 && form.dueDate.trim().length > 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rechnungen</h1>
          <p className="text-sm text-muted-foreground">
            Verwalte offene und bezahlte Rechnungen. Lade Rechnungen hoch oder lege sie manuell an.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Suchen..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-xs"
          />
          <Dialog
            open={open}
            onOpenChange={(value) => {
              setOpen(value);
              if (!value) {
                setEditing(null);
                setManualError("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditing(null);
                  setManualError("");
                  setForm({
                    title: "",
                    provider: "",
                    amount: "",
                    dueDate: new Date().toISOString().slice(0, 10),
                    status: "OPEN",
                    category: "OTHER",
                    notes: "",
                  });
                }}
              >
                Neue Rechnung
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Rechnung bearbeiten" : "Rechnung hinzufuegen"}</DialogTitle>
                <DialogDescription>
                  KI Upload funktioniert ohne manuelles Ausfuellen. Unten ist nur fuer manuelle Erfassung.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {!editing ? (
                  <div className="rounded-xl border border-border/70 bg-white/60 p-3 space-y-2">
                    <p className="text-sm font-medium">KI Upload (automatisch analysieren)</p>
                    <Input
                      placeholder="Upload Titel (optional)"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                    />
                    <Input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                    />
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
                <div>
                  <label className="text-sm font-medium">Titel</label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Anbieter</label>
                  <Input
                    value={form.provider}
                    onChange={(e) => setForm((prev) => ({ ...prev, provider: e.target.value }))}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium">Betrag</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Faelligkeitsdatum</label>
                    <Input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Input
                      value={form.status}
                      onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Kategorie</label>
                  <Input
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Notizen</label>
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                {manualError ? <p className="text-sm text-destructive">{manualError}</p> : null}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={editing ? handleUpdate : handleCreate} disabled={!canSaveManual}>
                  {editing ? "Aktualisieren" : "Manuell speichern"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titel</TableHead>
            <TableHead>Anbieter</TableHead>
            <TableHead>Betrag</TableHead>
            <TableHead>Faellig</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>{invoice.title}</TableCell>
              <TableCell>{invoice.provider}</TableCell>
              <TableCell>{formatMoney(invoice.amount)}</TableCell>
              <TableCell>{formatDate(invoice.dueDate)}</TableCell>
              <TableCell>
                <Badge variant={invoice.status === "OVERDUE" ? "destructive" : "secondary"}>
                  {invoice.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(invoice);
                      setManualError("");
                      setForm({
                        title: invoice.title ?? "",
                        provider: invoice.provider ?? "",
                        amount: String(invoice.amount ?? ""),
                        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().slice(0, 10) : "",
                        status: invoice.status ?? "OPEN",
                        category: invoice.category ?? "OTHER",
                        notes: invoice.notes ?? "",
                      });
                      setOpen(true);
                    }}
                  >
                    Bearbeiten
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(invoice.id)}>
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
