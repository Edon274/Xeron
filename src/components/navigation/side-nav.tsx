"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CreditCard, File, FileArchive, FileText, Home, Settings, Sparkles, Bot } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Vertraege", href: "/contracts", icon: FileText },
  { label: "Abos", href: "/subscriptions", icon: CreditCard },
  { label: "Rechnungen", href: "/invoices", icon: File },
  { label: "Dokumente", href: "/documents", icon: FileArchive },
  { label: "KI Assistent", href: "/ai", icon: Bot },
  { label: "Insights", href: "/insights", icon: Sparkles },
  { label: "Einstellungen", href: "/settings", icon: Settings },
];

export function SideNav() {
  const pathname = usePathname();
  const [logoError, setLogoError] = useState(false);
  if (pathname === "/" || pathname === "/login" || pathname === "/register") return null;

  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-5 border-r border-white/50 bg-white/55 p-6 text-sidebar-foreground backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 p-4">
        {!logoError ? (
          <img
            src="/branding/xeron-logo.png"
            alt="Xeron Logo"
            className="h-10 w-10 rounded-lg object-cover"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#2A6AFF] to-[#39C7B5]" />
        )}
        <div>
          <p className="text-base font-semibold text-sidebar-primary-foreground">Xeron</p>
          <p className="text-sm text-sidebar-foreground/80">Digital Life Assistant</p>
        </div>
      </div>

      <nav className="mt-2 flex flex-1 flex-col gap-1.5">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground hover:bg-white/70 hover:text-sidebar-primary-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-white/70 bg-white/60 p-3 text-xs text-sidebar-foreground/70">
        <p className="mb-2">Privater Bereich</p>
        <LogoutButton />
      </div>
    </aside>
  );
}
