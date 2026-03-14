"use client";

import React, { useState } from "react";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/hooks/useAuth";
import { ChatHistorySidebar } from "./ChatHistorySidebar";
import { MemberLimitedChat } from "./MemberLimitedChat";
import { CaptionGenerator } from "./CaptionGenerator";
import { Sparkles, X, Plus, Menu } from "lucide-react";

export function FloatingChatPanel() {
  const {
    isOpen,
    setIsOpen,
    startNewChat,
    history,
    loadChatSession,
    activeConversation,
    sendMessage,
    isLoading,
    error,
  } = useChat();
  const { hasRole, user } = useAuth();
  const [showHistory, setShowHistory] = useState(false);

  const isAdmin = hasRole("admin");

  if (!isOpen) return null;

  const handleNewChat = () => {
    startNewChat();
  };

  const isTreasurer = hasRole("treasurer");
  const title = isAdmin
    ? "Admin Assistant"
    : isTreasurer
      ? "Treasurer AI"
      : "TSEDK AI";
  const subtitle = isAdmin
    ? "Caption Generator"
    : isTreasurer
      ? "Financial Assistant"
      : !user
        ? "Limited access"
        : "Your personal assistant";

  return (
    <div
      className="fixed bottom-24 right-6 z-[9998] flex flex-col overflow-hidden rounded-2xl border border-[#2F2F2F] bg-[#1F1F1F] shadow-2xl"
      style={{ width: 380, height: 520 }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2F2F2F] bg-[#252525] p-4">
        <div className="flex items-center gap-2">
          {!isAdmin && history.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-1.5 hover:bg-[#2F2F2F] rounded-md transition-colors"
              title="Toggle history">
              <Menu size={18} className="text-[#E8E8E8]" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8E8E8] text-[#191919]">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="text-[11px] text-[#9E9E9E]">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNewChat}
            className="p-1.5 hover:bg-[#2F2F2F] rounded-md transition-colors"
            title="New chat">
            <Plus size={18} className="text-[#E8E8E8]" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-[#2F2F2F] rounded-md transition-colors"
            title="Close">
            <X size={18} className="text-[#E8E8E8]" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex flex-1 overflow-hidden">
        {!isAdmin && (
          <ChatHistorySidebar
            isOpen={showHistory}
            history={history}
            onLoadSession={(sessionId) => {
              loadChatSession(sessionId);
              setShowHistory(false);
            }}
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          {isAdmin ? (
            <CaptionGenerator />
          ) : (
            <MemberLimitedChat
              messages={activeConversation}
              onSendMessage={sendMessage}
              isLoading={isLoading}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  );
}
