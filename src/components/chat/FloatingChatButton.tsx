"use client";

import React from "react";
import { useChat } from "@/context/ChatContext";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FloatingChatButton() {
  const { isOpen, setIsOpen } = useChat();

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
      aria-label="Toggle Chat"
    >
      <Sparkles className="h-7 w-7" />
    </Button>
  );
}
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-[9999] flex items-center justify-center rounded-full bg-[#E8E8E8] text-[#191919] transition-transform duration-200 hover:scale-105"
      style={{
        width: 50,
        height: 50,
        boxShadow: "0 12px 30px rgba(25, 25, 25, 0.28)",
      }}
      aria-label="Open AI Chat Assistant">
      <div className="rounded-full bg-[#191919] p-1">
        <Sparkles size={18} className="text-[#E8E8E8]" />
      </div>
    </button>
  );
}
