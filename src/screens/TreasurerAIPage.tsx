"use client";

import React, { useRef, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/hooks/useAuth";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { Sparkles, ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function TreasurerAIPage() {
  const { activeConversation, sendMessage, isLoading, error, startNewChat } =
    useChat();
  const { hasRole } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation]);

  useEffect(() => {
    startNewChat();
  }, []);

  const isTreasurer = hasRole("treasurer");

  if (!isTreasurer) {
    return (
      <div className="h-[calc(100vh-73px)] flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Access Denied
          </h2>
          <p className="text-muted-foreground mb-4">
            Only treasurers can access the AI Financial Assistant.
          </p>
          <Link href="/dashboard" className="text-primary hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-73px)] flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/treasurer"
              className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20 gold-glow">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  AI Financial Assistant
                </h1>
                <p className="text-sm text-muted-foreground">
                  Get financial insights from your data
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeConversation.length === 0 && !isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="p-4 rounded-lg bg-primary/10 mb-4 inline-block">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Welcome to AI Finance
                </h2>
                <p className="text-muted-foreground mb-6">
                  I have access to your financial data. Ask me about:
                </p>
                <ul className="text-left space-y-2 text-sm text-muted-foreground mb-6">
                  <li>✓ Campaign progress and goals</li>
                  <li>✓ Donation trends and analysis</li>
                  <li>✓ Aserat (tithe) status</li>
                  <li>✓ Gbir (feast) compliance</li>
                  <li>✓ Selet (vow) due dates</li>
                  <li>✓ Member payment summaries</li>
                </ul>
              </div>
            </div>
          )}

          {activeConversation.map((msg, index) => (
            <MessageBubble key={index} role={msg.role} content={msg.content} />
          ))}

          {isLoading && activeConversation.length > 0 && (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card p-6">
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm mb-4 p-3 bg-red-500/10 rounded-lg">
              <AlertTriangle size={18} />
              <p>{error}</p>
            </div>
          )}
          <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
          <p className="text-center text-xs text-muted-foreground mt-3">
            All data is secure and only accessible to treasurers.
          </p>
        </div>
      </div>
    </div>
  );
}
