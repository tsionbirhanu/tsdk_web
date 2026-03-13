"use client";

import React from "react";
import { ChatMessage } from "@/context/ChatContext";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex gap-3 mb-3 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs px-4 py-3 rounded-lg ${
          isUser
            ? "bg-[#1E40AF] text-white rounded-br-none"
            : "bg-[#333333] text-[#E8E8E8] rounded-bl-none"
        }`}>
        <p className="text-sm break-words whitespace-pre-wrap">{content}</p>
        {!isUser && (
          <button
            onClick={handleCopy}
            className="mt-2 text-xs opacity-60 hover:opacity-100 flex items-center gap-1 transition-opacity">
            {copied ? (
              <>
                <Check size={12} /> Copied!
              </>
            ) : (
              <>
                <Copy size={12} /> Copy
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
