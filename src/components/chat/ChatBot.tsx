"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

const SUGGESTED_QUESTIONS = [
  "Which picks are you most confident about today?",
  "Why no picks for some games today?",
  "What's our hit rate so far?",
  "Who should I target in tonight's games?",
];

export function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "I'm Scout, your AI football analyst. I live in the data so you don't have to. Ask me about any player, match, or pick — I'll give you the numbers behind it.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Send last 6 messages as history so Scout has conversation context
      const history = messages
        .filter(m => m.id !== "welcome")
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history }),
      });
      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `asst_${Date.now()}`,
        role: "assistant",
        content: data.response || "Sorry, I couldn't process that. Try again!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: "Apologies, something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[600px] rounded-2xl border border-surface-border bg-surface-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-border bg-surface-2/50">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 border border-accent/30">
          <Sparkles className="h-4 w-4 text-accent" />
        </div>
        <div>
          <p className="font-semibold text-ink text-sm">Scout</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <p className="text-xs text-ink-muted">Online · AI Football Analyst</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3",
              msg.role === "user" && "flex-row-reverse"
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs",
                msg.role === "assistant"
                  ? "bg-accent/10 border border-accent/30"
                  : "bg-surface-3 border border-surface-border"
              )}
            >
              {msg.role === "assistant" ? (
                <Bot className="h-3.5 w-3.5 text-accent" />
              ) : (
                <User className="h-3.5 w-3.5 text-ink-muted" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                msg.role === "assistant"
                  ? "bg-surface-2 border border-surface-border text-ink-muted rounded-tl-sm"
                  : "bg-accent text-black font-medium rounded-tr-sm"
              )}
            >
              {/* Render markdown-ish formatting for assistant */}
              {msg.role === "assistant" ? (
                <div className="prose-sm space-y-1 leading-relaxed">
                  {msg.content.split("\n").map((line, i) => {
                    if (line.startsWith("**") && line.endsWith("**")) {
                      return (
                        <p key={i} className="font-semibold text-ink">
                          {line.slice(2, -2)}
                        </p>
                      );
                    }
                    if (line.startsWith("- ")) {
                      return (
                        <p key={i} className="flex gap-2">
                          <span className="text-accent">·</span>
                          <span>{line.slice(2)}</span>
                        </p>
                      );
                    }
                    if (line === "") return <div key={i} className="h-1" />;
                    // Handle inline bold
                    const parts = line.split(/\*\*([^*]+)\*\*/g);
                    return (
                      <p key={i}>
                        {parts.map((part, j) =>
                          j % 2 === 1 ? (
                            <strong key={j} className="text-ink font-semibold">
                              {part}
                            </strong>
                          ) : (
                            part
                          )
                        )}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-accent" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-surface-2 border border-surface-border px-4 py-3">
              <Loader2 className="h-4 w-4 text-ink-muted animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Suggested questions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs rounded-full border border-surface-border bg-surface-2 px-3 py-1.5 text-ink-muted hover:text-ink hover:border-accent/30 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-surface-border p-4">
        <div className="flex items-end gap-3 rounded-xl border border-surface-border bg-surface-2 px-4 py-3 focus-within:border-accent/30 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Scout about any player, pick, or match..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none min-h-[20px] max-h-24"
            style={{ height: "20px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "20px";
              target.style.height = Math.min(target.scrollHeight, 96) + "px";
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-dim transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-ink-faint">
          AI analysis is for entertainment only · Not financial advice
        </p>
      </div>
    </div>
  );
}
