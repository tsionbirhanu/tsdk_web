"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n";
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import heroBg from "@/assets/hero-bg.jpg";
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
  let streamDone = false;

  while (!streamDone) {
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
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as
          | string
          | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as
          | string
          | undefined;
        if (content) onDelta(content);
      } catch {
        /* ignore */
      }
    }
  }

  onDone();
}

const AiChatPage = () => {
  const { t, lang } = useI18n();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        lang === "am"
          ? "እንኳን ደህና መጡ! እኔ የቤተክርስቲያን አገልጋይ ነኝ። ስለ አገልግሎቶች፣ ድጋፍ፣ ወይም ሌላ ማንኛውም ነገር ይጠይቁኝ።"
          : lang === "om"
            ? "Nagaa! Gargaaraa waldaa keenya. Waa'ee tajaajila, arjoomaa, ykn waan kamiyyuu na gaafadhaa."
            : "Peace be with you! I'm your church assistant. Ask me about services, donations, or anything else.",
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
      await streamChat({
        messages: newMessages,
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
      });
    } catch (e: any) {
      setIsLoading(false);
      toast.error(e.message || "Failed to get AI response");
    }
  };

  const suggestions = [
    lang === "am"
      ? "የ ጸሎት ሰአት?"
      : "When are prayer times?",
    lang === "am"
      ? "እንደት መርዳት እችላለሁ?"
      : "How can I donate?",
    lang === "am" ? "በአላት" : "Upcoming holidays",
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
              <h1 className="text-xl font-heading font-bold text-foreground">
                {t("aiChat.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {lang === "am"
                  ? "የናንተው ቤተክርስቲያን አገልጋይ"
                  : "Your Church AI Assistant"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 relative">
          <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center opacity-5">
            <Image src={heroBg} alt="" fill className="object-cover" />
          </div>

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 animate-fade-in relative z-10 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[60%] px-5 py-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "glass-card text-foreground rounded-bl-md"
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
                <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div className="glass-card rounded-2xl rounded-bl-md px-5 py-4">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border p-6">
          <div className="flex gap-3 mb-4">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s)}
                className="px-4 py-2 rounded-full text-xs bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all">
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={t("aiChat.placeholder")}
              disabled={isLoading}
              className="flex-1 px-5 py-4 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading}
              className="px-6 py-4 rounded-xl bg-primary text-primary-foreground gold-glow hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              <span className="hidden sm:inline font-medium">Send</span>
            </button>
          </div>
        </div>
      </div>

      <div className="hidden xl:block w-80 border-l border-border p-6 space-y-6">
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-heading font-semibold text-foreground mb-3">
            About AI Assistant
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ask questions about church services, donation schedules, upcoming
            events, and spiritual guidance in English, Amharic, or Oromiffa.
          </p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-heading font-semibold text-foreground mb-3">
            Quick Topics
          </h3>
          <div className="space-y-2">
            {[
              "Service Times",
              "Donation Help",
              "Prayer Requests",
              "Church Events",
            ].map((topic) => (
              <button
                key={topic}
                onClick={() => setInput(topic)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                {topic}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiChatPage;
