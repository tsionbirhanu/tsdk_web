"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "@/hooks/useAuth"; // Assuming useAuth provides the user role

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatSession {
  sessionId: string;
  title: string;
  createdAt: string;
}

interface ChatContextType {
  // State
  isOpen: boolean;
  isLoading: boolean;
  history: ChatSession[];
  activeSessionId: string | null;
  activeConversation: ChatMessage[];
  error: string | null;

  // Actions
  setIsOpen: (open: boolean) => void;
  startNewChat: () => void;
  loadChatSession: (sessionId: string) => void;
  sendMessage: (message: string) => Promise<void>;
  deleteHistory: (sessionId: string) => Promise<void>;
  generateCaptions?: (campaignId: string) => Promise<any>; // For admin
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, session, hasRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<ChatMessage[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [guestMessageCount, setGuestMessageCount] = useState(0);

  const getApiEndpoints = useCallback(() => {
    if (hasRole("admin")) {
      return {
        chat: "/api/chat/member", // Admins use member chat for general queries
        history: "/api/chat/member/history",
        caption: "/api/chat/admin/caption",
      };
    }
    if (hasRole("treasurer")) {
      return {
        chat: "/api/chat/treasurer",
        history: "/api/chat/treasurer/history",
      };
    }
    if (hasRole("member")) {
      return { chat: "/api/chat/member", history: "/api/chat/member/history" };
    }
    // Guest
    return { chat: "/api/chat/guest", history: null };
  }, [hasRole]);

  const fetchHistory = useCallback(async () => {
    const endpoints = getApiEndpoints();
    if (!endpoints.history) {
      setHistory([]);
      return;
    }

    setIsLoading(true);
    try {
      const headers: any = {};
      // Add authorization header if user is authenticated
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(endpoints.history, { headers });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("History fetch error:", response.status, errorText);
        throw new Error(`Failed to fetch history: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        setHistory([]);
        return;
      }

      const data: ChatSession[] = JSON.parse(text);
      setHistory(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("Error fetching history:", e);
      setHistory([]);
      setError(null); // Don't show error to user for history fetch
    } finally {
      setIsLoading(false);
    }
  }, [getApiEndpoints, session]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      // Clear history for guests
      setHistory([]);
      setActiveConversation([]);
      setActiveSessionId(null);
    }
  }, [user, fetchHistory]);

  const startNewChat = () => {
    setActiveSessionId(null);
    setActiveConversation([]);
    setGuestMessageCount(0);
    setIsOpen(true);
  };

  const loadChatSession = async (sessionId: string) => {
    setIsLoading(true);
    setActiveSessionId(sessionId);
    // Simplified: In a real app, you'd fetch the full conversation for this session
    // For now, we just set the ID and let sendMessage handle the context.
    // This assumes the backend reconstructs history.
    setActiveConversation([]); // Clear previous messages
    setIsOpen(true);
    setIsLoading(false);
  };

  const sendMessage = async (message: string) => {
    const endpoints = getApiEndpoints();
    if (!endpoints.chat) {
      setError("No chat endpoint available for your role.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const newMessage: ChatMessage = { role: "user", content: message };
    setActiveConversation((prev) => [...prev, newMessage]);

    try {
      const headers: any = { "Content-Type": "application/json" };
      // Add authorization header if user is authenticated
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const isGuest = !user && endpoints.chat === "/api/chat/guest";
      const payload: any = { message };

      if (isGuest) {
        // For guests, send the message count
        payload.sessionMessageCount = guestMessageCount;
      } else {
        // For authenticated users, send the session ID
        payload.sessionId = activeSessionId;
      }

      const response = await fetch(endpoints.chat, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = "Sign in for more";
        try {
          const err = JSON.parse(errorText);
          errorMsg = err.error || errorMsg;
        } catch {
          errorMsg = errorText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const text = await response.text();
      if (!text) {
        throw new Error("Empty response from server");
      }

      const responseData = JSON.parse(text);

      // Check if guest limit reached
      if (isGuest && responseData.limitReached) {
        setError(responseData.message);
        setActiveConversation((prev) =>
          prev.filter((m) => m.content !== message),
        );
        setIsLoading(false);
        return;
      }

      const { reply, sessionId: newSessionId } = responseData;
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: reply,
      };
      setActiveConversation((prev) => [...prev, assistantMessage]);

      if (isGuest) {
        setGuestMessageCount((prev) => prev + 1);
      }

      if (newSessionId && !activeSessionId) {
        setActiveSessionId(newSessionId);
        // Refresh history to include the new session
        fetchHistory();
      }
    } catch (e: any) {
      setError(e.message);
      setActiveConversation((prev) =>
        prev.filter((m) => m.content !== message),
      ); // Remove optimistic message on error
    } finally {
      setIsLoading(false);
    }
  };

  const generateCaptions = async (campaignId: string) => {
    if (!hasRole("admin")) {
      setError("Only admins can generate captions.");
      return null;
    }
    const endpoints = getApiEndpoints();
    if (!endpoints.caption) {
      setError("Caption endpoint not available.");
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const headers: any = { "Content-Type": "application/json" };
      // Add authorization header if user is authenticated
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(endpoints.caption, {
        method: "POST",
        headers,
        body: JSON.stringify({ campaignId }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = "Failed to generate captions";
        try {
          const err = JSON.parse(errorText);
          errorMsg = err.error || errorMsg;
        } catch {
          errorMsg = errorText || "Failed to generate captions";
        }
        setError(errorMsg);
        return null;
      }

      const text = await response.text();
      if (!text) {
        const msg = "Empty response from server";
        setError(msg);
        return null;
      }

      const data = JSON.parse(text);
      setError(null);
      return data;
    } catch (e: any) {
      const errorMsg = e.message || "Failed to generate captions";
      setError(errorMsg);
      console.error("Caption generation error:", e);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // deleteHistory is complex with RLS, skipping for now.

  const value: ChatContextType = {
    isOpen,
    isLoading,
    history,
    activeSessionId,
    activeConversation,
    error,
    setIsOpen,
    startNewChat,
    loadChatSession,
    sendMessage,
    deleteHistory: async () => {}, // Placeholder
    generateCaptions: hasRole("admin") ? generateCaptions : undefined,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
