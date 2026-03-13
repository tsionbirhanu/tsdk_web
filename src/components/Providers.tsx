"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/hooks/useAuth";
import { ChatProvider } from "@/context/ChatContext";
import { ChatAssistant } from "@/components/chat/ChatAssistant";
import { useState } from "react";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <ChatProvider>
            <TooltipProvider>
              {children}
              <ChatAssistant />
            </TooltipProvider>
            <Toaster />
            <Sonner />
          </ChatProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
