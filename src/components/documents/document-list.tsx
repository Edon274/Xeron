"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type Document = {
  id: string;
  title: string;
  type: string;
  category: string;
  notes?: string | null;
  filePath: string;
  fileName: string;
  extractedText?: string | null;
  createdAt: string;
  extractedAmount?: number | null;
  extractedDate?: string | null;
  aiSummary?: string | null;
  cancellationHint?: string | null;
  linkedInvoiceId?: string | null;
  linkedContractId?: string | null;
  linkedSubscriptionId?: string | null;
};

function formatMoney(value: number | null | undefined) {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
}

export function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Document | null>(null);
  const [editing, setEditing] = useState<Document | null>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [editForm, setEditForm] = useState({
    title: "",
    type: "OTHER",
    category: "OTHER",
    notes: "",
    extractedAmount: "",
    extractedDate: "",
    aiSummary: "",
    cancellationHint: "",
  });

  async function load() {
    const res = await fetch("/api/documents");
    const data = await res.json();
    setDocuments(data);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.type.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q)
    );
  }, [documents, search]);

  async function handleUpload() {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    form.append("title", title);
    form.append("notes", notes);

    await fetch("/api/documents", { method: "POST", body: form });
    setOpen(false);
    setTitle("");
    setFile(null);
    setNotes("");
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Dokument wirklich loeschen?")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    await load();
  }

  function openEdit(doc: Document) {
    setEditing(doc);
    setEditForm({
      title: doc.title ?? "",
      type: doc.type ?? "OTHER",
      category: doc.category ?? "OTHER",
      notes: doc.notes ?? "",
      extractedAmount:
        typeof doc.extractedAmount === "number" && Number.isFinite(doc.extractedAmount)
          ? String(doc.extractedAmount)
          : "",
      extractedDate: doc.extractedDate ? new Date(doc.extractedDate).toISOString().slice(0, 10) : "",
      aiSummary: doc.aiSummary ?? "",
      cancellationHint: doc.cancellationHint ?? "",
    });
    setEditOpen(true);
  }

  async function handleEditSave() {
    if (!editing) return;
    await fetch(`/api/documents/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editForm.title,
        type: editForm.type,
        category: editForm.category,
        notes: editForm.notes || null,
        extractedAmount: editForm.extractedAmount.trim() ? Number(editForm.extractedAmount) : null,
        extractedDate: editForm.extractedDate.trim() ? editForm.extractedDate : null,
        aiSummary: editForm.aiSummary,
        cancellationHint: editForm.cancellationHint,
      }),
    });
    setEditOpen(false);
    setEditing(null);
    await load();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dokumente</h1>
          <p className="text-sm text-muted-foreground">
            Lade PDFs/Bilder hoch. Xeron analysiert Betrag, Kategorie und Fristen ueber lokale KI.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input placeholder="Suchen..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Dokument hochladen</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Neues Dokument</DialogTitle>
                <DialogDescription>Lade eine PDF oder ein Bild hoch. Die KI-Analyse startet automatisch.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium">Titel</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Datei</label>
                  <Input type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Notizen</label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Abbrechen
                </Button>
                <Button disabled={!file} onClick={handleUpload}>
                  Hochladen
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
            <TableHead>Typ</TableHead>
            <TableHead>Analyse</TableHead>
            <TableHead>Erstellt</TableHead>
            <TableHead>Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{doc.title}</p>
                  {doc.filePath ? (
                    <a href={doc.filePath} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                      {doc.fileName}
                    </a>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{doc.type}</Badge>
              </TableCell>
              <TableCell>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Betrag: {formatMoney(doc.extractedAmount)}</p>
                  <p>Datum: {doc.extractedDate ? new Date(doc.extractedDate).toLocaleDateString("de-DE") : "-"}</p>
                  <p>{doc.aiSummary || "Noch keine Zusammenfassung."}</p>
                  {doc.linkedInvoiceId ? <p className="text-foreground">Automatisch mit Rechnung verknuepft.</p> : null}
                  {doc.linkedContractId ? <p className="text-foreground">Automatisch mit Vertrag verknuepft.</p> : null}
                  {doc.linkedSubscriptionId ? <p className="text-foreground">Automatisch mit Abo verknuepft.</p> : null}
                  {doc.cancellationHint ? <p className="text-foreground">{doc.cancellationHint}</p> : null}
                </div>
              </TableCell>
              <TableCell>{new Date(doc.createdAt).toLocaleDateString("de-DE")}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(doc)}
                  >
                    Bearbeiten
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelected(doc);
                      setDetailOpen(true);
                    }}
                  >
                    Mehr anzeigen
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(doc.id)}>
                    Loeschen
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dokument Details</DialogTitle>
            <DialogDescription>Vollstaendige Analyse und Verknuepfungen</DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-3 text-sm">
              <p><span className="font-semibold">Titel:</span> {selected.title}</p>
              <p><span className="font-semibold">Datei:</span> {selected.fileName || "-"}</p>
              <p><span className="font-semibold">Typ:</span> {selected.type}</p>
              <p><span className="font-semibold">Kategorie:</span> {selected.category}</p>
              <p><span className="font-semibold">Betrag:</span> {formatMoney(selected.extractedAmount)}</p>
              <p><span className="font-semibold">Datum:</span> {selected.extractedDate ? new Date(selected.extractedDate).toLocaleDateString("de-DE") : "-"}</p>
              <p><span className="font-semibold">KI Zusammenfassung:</span> {selected.aiSummary || "-"}</p>
              <p><span className="font-semibold">Fristen/Kuendigung:</span> {selected.cancellationHint || "-"}</p>
              <p><span className="font-semibold">Verknuepfte Rechnung:</span> {selected.linkedInvoiceId || "-"}</p>
              <p><span className="font-semibold">Verknuepfter Vertrag:</span> {selected.linkedContractId || "-"}</p>
              <p><span className="font-semibold">Verknuepftes Abo:</span> {selected.linkedSubscriptionId || "-"}</p>
              {selected.filePath ? (
                <a href={selected.filePath} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  Datei oeffnen
                </a>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(value) => {
          setEditOpen(value);
          if (!value) setEditing(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dokument bearbeiten</DialogTitle>
            <DialogDescription>Passe erkannte Daten manuell an, falls OCR/KI etwas falsch gelesen hat.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              placeholder="Titel"
              value={editForm.title}
              onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Typ (INVOICE/CONTRACT/SUBSCRIPTION/OTHER)"
                value={editForm.type}
                onChange={(e) => setEditForm((p) => ({ ...p, type: e.target.value }))}
              />
              <Input
                placeholder="Kategorie"
                value={editForm.category}
                onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                type="number"
                step="0.01"
                placeholder="Betrag"
                value={editForm.extractedAmount}
                onChange={(e) => setEditForm((p) => ({ ...p, extractedAmount: e.target.value }))}
              />
              <Input
                type="date"
                value={editForm.extractedDate}
                onChange={(e) => setEditForm((p) => ({ ...p, extractedDate: e.target.value }))}
              />
            </div>
            <Input
              placeholder="Notizen"
              value={editForm.notes}
              onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
            />
            <Textarea
              rows={3}
              placeholder="KI Zusammenfassung"
              value={editForm.aiSummary}
              onChange={(e) => setEditForm((p) => ({ ...p, aiSummary: e.target.value }))}
            />
            <Textarea
              rows={2}
              placeholder="Kuendigungs-/Fristenhinweis"
              value={editForm.cancellationHint}
              onChange={(e) => setEditForm((p) => ({ ...p, cancellationHint: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEditSave} disabled={!editForm.title.trim()}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
