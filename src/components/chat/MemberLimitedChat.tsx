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
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isGuest = !user;

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-sm text-gray-400">
            <p className="font-semibold text-gray-300">Welcome to Tsedek AI</p>
            {isGuest && (
              <p className="mt-1">
                As a guest, you can send up to 2 messages.
              </p>
            )}
            <p className="mt-1">
              Ask me anything about TSEDK, our mission, or how to get involved.
            </p>
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
      };
      addMessage(currentConversationId, aiMessage);
    } catch (error) {
      // Add error message
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        role: "assistant",
        content:
          error instanceof Error
            ? error.message
            : "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      addMessage(currentConversationId, errorMessage);
    } finally {
      setProcessingMessage(false);
      setLoading(false);
    }
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-[#888888]">
        Start a conversation
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#1F1F1F]">
      {/* Scope Information */}
      <div className="border-b border-[#2F2F2F] bg-[#252525] px-4 py-3 text-xs text-[#AAAAAA]">
        <p className="font-semibold text-[#E8E8E8] mb-1">I can help with:</p>
        <p>{MEMBER_CHAT_SCOPE.join(", ")}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {conversation.messages.length === 0 ? (
          <div className="text-center text-[#888888] py-8">
            <p className="text-sm">
              Start by asking about {MEMBER_CHAT_SCOPE[0] || "our services"}.
            </p>
          </div>
        ) : (
          conversation.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
        {processingMessage && (
          <div className="flex gap-3 mb-3">
            <div className="max-w-xs px-4 py-3 rounded-lg bg-[#333333] text-[#E8E8E8] rounded-bl-none">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-[#7B8EFF] rounded-full animate-bounce"></span>
                <span
                  className="w-2 h-2 bg-[#7B8EFF] rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}></span>
                <span
                  className="w-2 h-2 bg-[#7B8EFF] rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={processingMessage || loading}
      />
    </div>
  );
}
