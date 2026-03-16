"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, CreditCard, File, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/contracts", label: "Vertraege", icon: FileText },
  { href: "/subscriptions", label: "Abos", icon: CreditCard },
  { href: "/invoices", label: "Rechnungen", icon: File },
  { href: "/ai", label: "KI", icon: Bot },
];

export function MobileNav() {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/login" || pathname === "/register") return null;

  return (
    <nav className="fixed bottom-3 left-1/2 z-40 flex w-[min(96vw,560px)] -translate-x-1/2 justify-between rounded-2xl border border-white/70 bg-white/90 px-2 py-2 shadow-lg backdrop-blur lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-w-[64px] flex-col items-center rounded-xl px-2 py-1 text-xs",
              active ? "bg-primary text-primary-foreground" : "text-foreground/80"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
