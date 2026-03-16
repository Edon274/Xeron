"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Registrierung fehlgeschlagen.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[72vh] w-full max-w-md items-center">
      <form onSubmit={onSubmit} className="glass-card w-full space-y-4 rounded-2xl p-6">
        <h1 className="text-2xl font-semibold">Registrieren</h1>
        <p className="text-sm text-muted-foreground">Erstelle deinen privaten Xeron-Bereich.</p>
        <Input placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Passwort (mind. 8 Zeichen)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Registrieren..." : "Konto erstellen"}
        </Button>
        <p className="text-sm text-muted-foreground">
          Bereits Konto? <Link href="/login" className="text-primary hover:underline">Zum Login</Link>
        </p>
      </form>
    </div>
  );
}

