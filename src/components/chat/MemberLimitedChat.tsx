"use client";

import React, { useRef, useEffect } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "@/context/ChatContext";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, AlertTriangle } from "lucide-react";

interface MemberLimitedChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function MemberLimitedChat({
  messages,
  onSendMessage,
  isLoading,
  error,
}: MemberLimitedChatProps) {
  const { user, hasRole } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isGuest = !user;
  const isTreasurer = hasRole("treasurer");
  const isAdmin = hasRole("admin");

  const getWelcomeMessage = () => {
    if (isGuest) {
      return "As a guest, you can ask general questions about TSEDK. Send up to 2 messages.";
    }
    if (isTreasurer) {
      return "I have access to your financial data. Ask about campaign progress, donations, Aserat, Gbir, Selet, and member payments.";
    }
    if (isAdmin) {
      return "You can ask questions about TSEDK or use the Caption Generator tab to create social media content.";
    }
    return "Ask me anything about TSEDK, our mission, or how to get involved.";
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-sm text-gray-400">
            <p className="font-semibold text-gray-300">Welcome to TSEDK AI</p>
            <p className="mt-2">{getWelcomeMessage()}</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <MessageBubble key={index} role={msg.role} content={msg.content} />
        ))}
        {isLoading && messages.length > 0 && (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
          </div>
        )}
      </div>
      <div className="border-t border-[#2F2F2F] p-4">
        {error && (
          <div className="flex items-center gap-2 text-red-500 text-xs mb-2 p-2 bg-red-500/10 rounded-md">
            <AlertTriangle size={16} />
            <p>{error}</p>
          </div>
        )}
        <ChatInput onSendMessage={onSendMessage} disabled={isLoading} />
        {isGuest && (
          <p className="text-center text-xs text-gray-500 mt-2">
            Sign up or log in to save your chat history and get unlimited
            access.
          </p>
        )}
      </div>
    </div>
  );
}
