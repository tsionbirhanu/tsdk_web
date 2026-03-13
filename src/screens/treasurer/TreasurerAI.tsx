"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = "/api/chat";

async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: Message[];
  onDelta: (deltaText: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    if (resp.status === 429)
      throw new Error("Rate limit exceeded. Please wait a moment.");
    if (resp.status === 402)
      throw new Error("AI credits exhausted. Please add credits.");
    throw new Error(data.error || "Failed to get AI response");
  }

  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        onDone();
        return;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        // Continue parsing
      }
    }
  }

  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw || !raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        /* ignore */
      }
    }
  }

  onDone();
}

const TreasurerAI = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: "Hello! I'm your financial AI assistant. I can help you analyze donation trends, member payment patterns, budget analysis, financial forecasting, and answer questions about church finances. I have access to your donation data and can provide insights based on real-time information." 
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    // Fetch financial data to provide context
    let financialContext = "";
    try {
      const { data: donations } = await supabase
        .from("donations")
        .select("amount, type, status, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (donations) {
        const total = donations.reduce((sum, d) => sum + Number(d.amount), 0);
        const verified = donations.filter((d) => d.status === "verified").reduce((sum, d) => sum + Number(d.amount), 0);
        const byType = donations.reduce((acc: any, d: any) => {
          acc[d.type] = (acc[d.type] || 0) + Number(d.amount);
          return acc;
        }, {});
        
        financialContext = `\n\nCurrent financial data:\n- Total donations: ${total.toLocaleString()} ETB\n- Verified: ${verified.toLocaleString()} ETB\n- By type: ${JSON.stringify(byType)}\n- Recent donations: ${donations.slice(0, 5).map((d: any) => `${d.type}: ${d.amount} ETB (${d.status})`).join(", ")}`;
      }
    } catch (err) {
      // Continue without context if fetch fails
    }

    const userMsg: Message = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length > newMessages.length) {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m,
          );
        }
        return [
          ...prev.slice(0, newMessages.length),
          { role: "assistant", content: assistantSoFar },
        ];
      });
    };

    try {
      // Add financial context to the system message
      const messagesWithContext = [
        {
          role: "system" as const,
          content: `You are a financial AI assistant for an Ethiopian Orthodox Church. You help treasurers with:
- Donation trends and analysis
- Member payment patterns
- Budget analysis and forecasting
- Financial reporting insights
- Answering questions about church finances

You can respond in English, Amharic (አማርኛ), or Afaan Oromoo based on the language the user writes in.
Be professional, accurate, and provide data-driven insights.${financialContext}`,
        },
        ...newMessages,
      ];
      
      await streamChat({
        messages: messagesWithContext,
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
      });
    } catch (e: any) {
      setIsLoading(false);
      toast.error(e.message || "Failed to get AI response");
    }
  };

  const suggestions = [
    "Summarize this month's finances",
    "Which members have overdue payments?",
    "Forecast next quarter's income",
    "Compare donation categories",
  ];

  return (
    <div className="flex h-[calc(100vh-73px)]">
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/20 gold-glow">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-foreground">AI Financial Assistant</h1>
              <p className="text-sm text-muted-foreground">AI-powered financial analysis and insights</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 animate-fade-in ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[60%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "glass-card text-foreground rounded-bl-md"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="glass-card rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border p-6">
          <div className="flex flex-wrap gap-2 mb-3">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => setInput(s)} className="px-3 py-1.5 rounded-full text-xs bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all">
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <input
              type="text" value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about finances..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
            />
            <button onClick={sendMessage} disabled={isLoading} className="px-5 py-3 rounded-xl bg-primary text-primary-foreground gold-glow hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreasurerAI;

