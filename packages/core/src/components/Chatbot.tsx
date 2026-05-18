"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Loader2,
  RefreshCcw,
  AlertCircle,
} from "lucide-react";
import type { Chatbot as ChatbotConfig } from "../types/content";

type Props = {
  config: ChatbotConfig;
  locale: string;
  /** Absolute or relative URL of the /api/chat endpoint. Defaults to a
   * same-origin call so the studio (which serves its own API) works without
   * extra config; tenant static builds pass the studio's public URL. */
  apiUrl?: string;
};

type Msg = { role: "user" | "assistant"; content: string };

export function Chatbot({ config, locale, apiUrl = "/api/chat" }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: config.welcomeMessage },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setMessages([{ role: "assistant", content: config.welcomeMessage }]);
  }, [config.welcomeMessage, locale]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      const next: Msg[] = [...messages, { role: "user", content: trimmed }];
      setMessages([...next, { role: "assistant", content: "" }]);
      setInput("");
      setStreaming(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next, locale }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const json = await res.json().catch(() => null);
          throw new Error(json?.error ?? `HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: acc };
            return copy;
          });
        }
      } catch (err) {
        if ((err as { name?: string })?.name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Fehler bei der Antwort");
          setMessages((prev) => prev.slice(0, -1));
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, locale, streaming, apiUrl],
  );

  function reset() {
    abortRef.current?.abort();
    setMessages([{ role: "assistant", content: config.welcomeMessage }]);
    setInput("");
    setError(null);
    setStreaming(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  if (!config.isEnabled) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Chat schliessen" : "Chat öffnen"}
        className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:scale-105 transition"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      <div
        className={`fixed bottom-24 right-5 z-50 w-[min(380px,calc(100vw-2.5rem))] origin-bottom-right transition-all ${
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div className="overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl border border-white/40 ring-1 ring-black/5 shadow-2xl">
          <header className="flex items-center justify-between gap-3 border-b border-slate-200/70 bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{config.botName}</p>
                <p className="text-xs text-blue-100">{streaming ? "Tippt …" : "Online"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              title="Konversation zurücksetzen"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white transition"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
            </button>
          </header>

          <div
            ref={scrollRef}
            className="max-h-[440px] min-h-[280px] overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-white/60 to-white/30"
          >
            {messages.map((m, i) => (
              <Bubble key={i} message={m} botName={config.botName} streaming={streaming && i === messages.length - 1 && m.role === "assistant"} />
            ))}
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200/70 bg-white/70 px-3 py-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={streaming}
                placeholder="Frag mich etwas …"
                className="flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:bg-slate-50 transition max-h-24"
              />
              <button
                type="button"
                onClick={() => send(input)}
                disabled={streaming || input.trim().length === 0}
                className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
                aria-label="Senden"
              >
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-2 text-[10px] text-slate-400">
              Antworten basieren auf den Inhalten dieser Seite.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function Bubble({
  message,
  botName,
  streaming,
}: {
  message: Msg;
  botName: string;
  streaming: boolean;
}) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="flex max-w-[85%] flex-col gap-1">
        {!isUser && (
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-1">
            {botName}
          </span>
        )}
        <div
          className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
            isUser
              ? "bg-blue-600 text-white rounded-br-md"
              : "bg-white text-slate-900 border border-slate-200 rounded-bl-md"
          }`}
        >
          {message.content || (streaming && <span className="inline-flex h-4 items-center gap-1 text-slate-400"><Dot delay={0} /><Dot delay={150} /><Dot delay={300} /></span>)}
        </div>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
