"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Send,
  Sparkles,
  User,
  Loader2,
  Sprout,
  CloudRain,
  Bug,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ChatMessage } from "@/lib/types";

const SUGGESTIONS = [
  { icon: Sprout, text: "Which crop should I sow this kharif season in Maharashtra?" },
  { icon: Bug, text: "How do I control bollworm in cotton organically?" },
  { icon: CloudRain, text: "It's forecast to rain heavily next week — what should I do?" },
  { icon: TrendingUp, text: "When is the best time to sell onions for maximum profit?" },
];

export function AdvisorView() {
  const role = useStore((s) => s.role);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Namaste! 🌾 I'm FarmMart AI, your personal agriculture advisor. I can help you with crop selection, pest management, irrigation schedules, post-harvest practices, and market timing — tailored to your role as a ${role.toLowerCase()}. 

Ask me anything, or pick a suggestion below to get started.`,
        createdAt: new Date().toISOString(),
      },
    ]);
  }, [role]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = {
      id: "u" + Date.now(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    const history = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const data = await api<{ reply: string }>("/api/ai/crop-advisor", {
        method: "POST",
        body: JSON.stringify({
          message: text,
          history,
          context: { role },
        }),
      });
      setMessages((m) => [
        ...m,
        {
          id: "a" + Date.now(),
          role: "assistant",
          content: data.reply,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Bot className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            AI Crop Advisor
            <Badge className="gap-1 bg-primary/15 text-primary">
              <Sparkles className="size-3" /> Powered by Z.ai
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground">
            Personalized farming intelligence — crops, pests, weather &amp; market timing.
          </p>
        </div>
      </div>

      <Card className="flex h-[62vh] min-h-[460px] flex-col overflow-hidden p-0">
        {/* Messages */}
        <div
          ref={scrollRef}
          className="fm-scroll flex-1 space-y-4 overflow-y-auto p-4"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex gap-2.5",
                m.role === "user" && "flex-row-reverse"
              )}
            >
              <div
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full",
                  m.role === "assistant"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {m.role === "assistant" ? (
                  <Bot className="size-4" />
                ) : (
                  <User className="size-4" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "assistant"
                    ? "rounded-tl-sm bg-secondary text-secondary-foreground"
                    : "rounded-tr-sm bg-primary text-primary-foreground"
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2.5">
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                <Bot className="size-4" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-secondary px-4 py-3">
                <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="size-2 animate-bounce rounded-full bg-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && !loading && (
          <div className="border-t border-border/60 p-3">
            <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">
              Try asking:
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.text}
                    onClick={() => send(s.text)}
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-background p-2.5 text-left text-xs transition-colors hover:border-primary/40 hover:bg-accent/40"
                  >
                    <Icon className="size-4 shrink-0 text-primary" />
                    <span>{s.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border/60 p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about crops, pests, weather, pricing…"
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()} size="icon">
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
