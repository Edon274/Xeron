import type { ReactNode } from "react";
import { SideNav } from "@/components/navigation/side-nav";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { ChatLauncher } from "@/components/ai/chat-launcher";
import { FadeIn } from "@/components/motion/fade-in";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#edf4ff] via-[#f8fbff] to-[#eefdf9] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(42,106,255,0.12),transparent_35%),radial-gradient(circle_at_85%_12%,rgba(57,199,181,0.12),transparent_28%)]" />
      <div className="relative flex min-h-screen w-full">
        <SideNav />
        <main className="flex-1 px-6 py-6 pb-24 md:px-10 md:py-10 xl:px-14">
          <div className="w-full">
            <FadeIn>{children}</FadeIn>
          </div>
        </main>
      </div>
      <MobileNav />
      <ChatLauncher />
    </div>
  );
}
