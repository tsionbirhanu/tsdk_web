"use client";

import React, { useState, useRef, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/hooks/useAuth";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { CaptionGenerator } from "@/components/chat/CaptionGenerator";
import { Sparkles, ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AdminAIPage() {
  const {
    activeConversation,
    sendMessage,
    isLoading,
    error,
    startNewChat,
    generateCaptions,
  } = useChat();
  const { hasRole } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "caption">("chat");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation]);

  useEffect(() => {
    startNewChat();
  }, []);

  const isAdmin = hasRole("admin");

  if (!isAdmin) {
    return (
      <div className="h-[calc(100vh-73px)] flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Access Denied
          </h2>
          <p className="text-muted-foreground mb-4">
            Only admins can access the AI Administration Assistant.
          </p>
          <Link href="/admin" className="text-primary hover:underline">
            Back to Admin
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
              href="/admin"
              className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20 gold-glow">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Admin AI Assistant
                </h1>
                <p className="text-sm text-muted-foreground">
                  Chat support and caption generation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card px-6 flex gap-2">
        <button
          onClick={() => {
            setActiveTab("chat");
            startNewChat();
          }}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === "chat"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}>
          General Chat
        </button>
        <button
          onClick={() => setActiveTab("caption")}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === "caption"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}>
          Caption Generator
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === "chat" ? (
          <>
            {/* Chat Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeConversation.length === 0 && !isLoading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md">
                    <div className="p-4 rounded-lg bg-primary/10 mb-4 inline-block">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      Welcome to Admin Assistant
                    </h2>
                    <p className="text-muted-foreground">
                      Ask me anything about TSEDK, our mission, campaigns, or
                      community management.
                    </p>
                  </div>
                </div>
              )}

              {activeConversation.map((msg, index) => (
                <MessageBubble
                  key={index}
                  role={msg.role}
                  content={msg.content}
                />
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
            </div>
          </>
        ) : (
          // Caption Generator Tab
          <div className="flex-1 overflow-hidden">
            <CaptionGenerator />
          </div>
        )}
      </div>
    </div>
  );
}
