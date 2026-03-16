"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AIChat } from "@/components/ai/ai-chat";

export function ChatLauncher() {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/login" || pathname === "/register") return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-[#2A6AFF] to-[#39C7B5] text-white shadow-xl shadow-[#2a6aff40] hover:opacity-95"
          aria-label="KI-Assistent oeffnen"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl border-white/70 bg-white/90 backdrop-blur-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Xeron KI Assistent</DialogTitle>
        </DialogHeader>
        <AIChat compact />
      </DialogContent>
    </Dialog>
  );
}
