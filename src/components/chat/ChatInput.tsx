"use client";

import React, { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  disabled = false,
}: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything..."
        disabled={disabled}
        className="flex-1 px-3 py-2 bg-[#2F2F2F] text-white placeholder-[#888888] rounded-lg border border-[#3F3F3F] focus:outline-none focus:border-[#4F4F4F] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      />
      <Button type="submit" size="icon" disabled={disabled || !input.trim()}>
        <Send size={18} />
      </Button>
    </form>
  );
}
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="px-3 py-2 bg-[#1E40AF] hover:bg-[#1E3EA8] disabled:bg-[#555555] text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center">
        <Send size={18} />
      </button>
    </form>
  );
}
