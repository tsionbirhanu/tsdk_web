"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "use-client";
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
  const { user, hasRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<ChatMessage[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);

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
      const response = await fetch(endpoints.history);
      if (!response.ok) throw new Error("Failed to fetch history");
      const data: ChatSession[] = await response.json();
      setHistory(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [getApiEndpoints]);

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
      const response = await fetch(endpoints.chat, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          sessionId: activeSessionId,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "API request failed");
      }

      const { reply, sessionId: newSessionId } = await response.json();
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: reply,
      };
      setActiveConversation((prev) => [...prev, assistantMessage]);

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
      return;
    }
    const endpoints = getApiEndpoints();
    if (!endpoints.caption) return;

    setIsLoading(true);
    try {
      const response = await fetch(endpoints.caption, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });
      if (!response.ok) throw new Error("Failed to generate captions");
      const data = await response.json();
      return data;
    } catch (e: any) {
      setError(e.message);
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

    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  };

  const startNewChat = () => {
    const type = getCurrentConversation()?.type || ("general" as const);
    createConversation(type);
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversationId,
        isOpen,
        loading,
        createConversation,
        setCurrentConversation: setCurrentConv,
        getCurrentConversation,
        addMessage,
        setIsOpen,
        setLoading,
        deleteConversation,
        startNewChat,
      }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
