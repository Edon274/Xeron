import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/75 p-10 shadow-2xl shadow-[#2a6aff1a] backdrop-blur-xl">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-[#2A6AFF]/30 to-[#39C7B5]/20 blur-3xl" />
      <div className="relative flex min-h-[68vh] flex-col items-center justify-center gap-8 text-center">
        <img
          src="/branding/xeron-logo.png"
          alt="Xeron"
          className="h-20 w-auto max-w-[320px] object-contain"
        />
        <span className="rounded-full border border-white/70 bg-white/70 px-4 py-1 text-xs font-medium tracking-wide text-muted-foreground">
          XERON - Local-First AI
        </span>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Organisiere dein digitales Leben in einer ruhigen Oberflaeche.
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground">
            Xeron buendelt Vertraege, Abos, Rechnungen und Dokumente. Die lokale KI mit Ollama hilft dir beim Verstehen,
            Priorisieren und Sparen.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/login" className={buttonVariants({ size: "lg" })}>
            Login
          </Link>
          <Link href="/register" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Registrieren
          </Link>
        </div>
      </div>
    </div>
  );
}
