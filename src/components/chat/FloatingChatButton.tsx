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
      aria-label="Toggle Chat">
      <Sparkles className="h-7 w-7" />
    </Button>
  );
}
