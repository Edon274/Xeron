"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ContractForm, ContractFormValues } from "@/components/contracts/contract-form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type Contract = {
  id: string;
  title: string;
  provider: string;
  category: string;
  startDate: string;
  renewalDate?: string | null;
  terminationDate?: string | null;
  frequency: string;
  amount: number;
  status: string;
  notes?: string | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("de-DE");
}

export function ContractList() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Contract | null>(null);
  const [open, setOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");

  async function loadContracts() {
    const res = await fetch("/api/contracts");
    const data = await res.json();
    setContracts(data);
  }

  useEffect(() => {
    loadContracts();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contracts.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.provider.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [contracts, search]);

  async function handleCreate(values: ContractFormValues) {
    await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setOpen(false);
    await loadContracts();
  }

  async function handleUpdate(values: ContractFormValues) {
    if (!editing) return;
    await fetch(`/api/contracts/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setEditing(null);
    setOpen(false);
    await loadContracts();
  }

  async function handleDelete(id: string) {
    if (!confirm("Vertrag wirklich loeschen?")) return;
    await fetch(`/api/contracts/${id}`, { method: "DELETE" });
    await loadContracts();
  }

  async function handleUploadToAI() {
    if (!uploadFile) return;
    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("title", uploadTitle || uploadFile.name);
    fd.append("notes", uploadNotes);
    fd.append("intentType", "CONTRACT");
    await fetch("/api/documents", { method: "POST", body: fd });
    setUploadFile(null);
    setUploadTitle("");
    setUploadNotes("");
    setOpen(false);
    await loadContracts();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vertraege</h1>
          <p className="text-sm text-muted-foreground">Hier findest du alle Vertraege und kannst sie bearbeiten.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input placeholder="Suchen..." value={search} onChange={(event) => setSearch(event.target.value)} className="max-w-xs" />
          <Button
            className="whitespace-nowrap"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Neuer Vertrag
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titel</TableHead>
            <TableHead>Anbieter</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Erneuerung</TableHead>
            <TableHead>Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((contract) => (
            <TableRow key={contract.id}>
              <TableCell>{contract.title}</TableCell>
              <TableCell>{contract.provider}</TableCell>
              <TableCell>
                <Badge variant="secondary">{contract.status}</Badge>
              </TableCell>
              <TableCell>{formatDate(contract.renewalDate)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(contract);
                      setOpen(true);
                    }}
                  >
                    Bearbeiten
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(contract.id)}>
                    Loeschen
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) setEditing(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Vertrag bearbeiten" : "Vertrag erstellen"}</DialogTitle>
            <DialogDescription>Speichere den Vertrag, damit Xeron Fristen und Kosten auswerten kann.</DialogDescription>
          </DialogHeader>
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
          <ContractForm
            initial={editing ?? undefined}
            onSubmit={editing ? handleUpdate : handleCreate}
            submitLabel={editing ? "Aktualisieren" : "Erstellen"}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
