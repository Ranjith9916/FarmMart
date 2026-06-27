"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  X,
  Send,
  Headphones,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  time: string;
}

const QUICK_REPLIES = [
  "How do I track my order?",
  "What payment methods are available?",
  "How do I become a seller?",
  "How does the AI advisor work?",
];

const AGENT_RESPONSES: Record<string, string> = {
  "track my order":
    "You can track your order by going to the Orders page. Each order shows a live status tracker from PENDING → CONFIRMED → PACKED → SHIPPED → DELIVERED. You'll also see an estimated delivery date!",
  "payment":
    "We support 6 payment methods: UPI (PhonePe, Google Pay, Paytm), Credit/Debit Card, Net Banking (all major banks), Wallet (Paytm, Mobikwik), EMI (3/6/9/12 months), and Cash on Delivery.",
  "seller":
    "To become a seller, sign up and select 'Farmer' as your role. You'll get access to the Farm Dashboard where you can list products, manage inventory, and track sales. Click 'Sell Product' in the header to list your first product!",
  "ai advisor":
    "Our AI Crop Advisor is powered by Z.ai and provides personalized farming advice — crop selection, pest management, irrigation, harvesting, and market timing. Just go to the AI Crop Advisor page and ask any question!",
  default:
    "Thanks for reaching out! Our team typically responds within a few minutes. For urgent issues, you can also call us at +91 1800 123 4567. How else can I help you today?",
};

export function LiveChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "agent",
          text: "Hi there! 👋 Welcome to FarmMart Support. How can I help you today?",
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: "u" + Date.now(),
      role: "user",
      text: text.trim(),
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    // Simulate agent response
    setTimeout(() => {
      const lowerText = text.toLowerCase();
      let response = AGENT_RESPONSES.default;
      for (const key of Object.keys(AGENT_RESPONSES)) {
        if (lowerText.includes(key)) {
          response = AGENT_RESPONSES[key];
          break;
        }
      }
      setMessages((prev) => [
        ...prev,
        {
          id: "a" + Date.now(),
          role: "agent",
          text: response,
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setTyping(false);
    }, 1200);
  };

  return (
    <>
      {/* Floating chat button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl lg:bottom-6"
          aria-label="Open support chat"
        >
          <MessageCircle className="size-5" />
          <span className="hidden sm:inline">Support</span>
          <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-green-500 text-[8px] font-bold text-white">
            1
          </span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl lg:bottom-6">
          {/* Header */}
          <div className="flex items-center justify-between bg-primary p-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-full bg-white/20">
                <Headphones className="size-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">FarmMart Support</div>
                <div className="flex items-center gap-1 text-[10px] text-primary-foreground/80">
                  <span className="size-1.5 animate-pulse rounded-full bg-green-400" />
                  Online · Usually replies instantly
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="grid size-7 place-items-center rounded-full hover:bg-white/20"
              aria-label="Close chat"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="fm-scroll flex-1 space-y-3 overflow-y-auto bg-secondary/30 p-3"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2",
                  msg.role === "user" && "flex-row-reverse"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
                    msg.role === "agent"
                      ? "rounded-tl-sm bg-background"
                      : "rounded-tr-sm bg-primary text-primary-foreground"
                  )}
                >
                  {msg.text}
                  <div className="mt-1 text-[9px] opacity-60">{msg.time}</div>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex gap-2">
                <div className="rounded-2xl rounded-tl-sm bg-background px-4 py-3">
                  <div className="flex gap-1">
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick replies */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 border-t border-border/60 p-2">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-[10px] font-medium hover:bg-accent"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-border/60 p-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Type a message…"
              className="h-9 text-xs"
            />
            <Button
              size="icon"
              className="size-9 shrink-0"
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
            >
              <Send className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
