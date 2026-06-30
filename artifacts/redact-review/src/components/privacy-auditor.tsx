import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, X, ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const SUGGESTED_PROMPTS = [
  "Check if all dates are redacted",
  "Show remaining phone numbers",
  "Can I safely share this document?",
  "Are any names still visible?",
  "Summarize this review",
  "Which items have low confidence?",
];

interface Props {
  documentId: string;
  onClose: () => void;
}

export default function PrivacyAuditor({ documentId, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "I'm your Privacy Auditor. I can answer questions about this document's redaction status using only the actual review data — no hallucinations.\n\nAsk me anything about the PII detected, confirmed, or remaining.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || isStreaming) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: question.trim(),
    };

    const assistantId = `a-${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);
    setError(null);

    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const resp = await fetch(`${base}/api/documents/${documentId}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error ?? `Server error ${resp.status}`);
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.content) {
              fullContent += json.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: fullContent }
                    : m
                )
              );
            }
            if (json.error) throw new Error(json.error);
            if (json.done) break;
          } catch {}
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, streaming: false } : m
        )
      );
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-[380px] border-l border-[#E5DDD2] bg-[#FFFDF9] flex flex-col shadow-[-4px_0_20px_rgba(0,0,0,0.06)] z-20 h-full"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[#E5DDD2] bg-[#FAF7F2]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#6B1E2B]/10 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-[#6B1E2B]" />
          </div>
          <div>
            <p className="font-serif font-semibold text-sm text-[#1E1E1E]">Privacy Auditor</p>
            <p className="text-[10px] text-[#888888]">Context-aware AI · Data-only answers</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-[#666666]" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                  msg.role === "assistant"
                    ? "bg-[#6B1E2B]/10"
                    : "bg-[#1E1E1E]/10"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Sparkles className="h-3 w-3 text-[#6B1E2B]" />
                ) : (
                  <User className="h-3 w-3 text-[#1E1E1E]" />
                )}
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#6B1E2B] text-white rounded-tr-sm"
                    : "bg-[#F5F1EA] text-[#1E1E1E] rounded-tl-sm"
                }`}
              >
                {msg.content || (msg.streaming && (
                  <span className="inline-flex gap-0.5 items-center h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6B1E2B]/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6B1E2B]/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6B1E2B]/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                ))}
                {msg.streaming && msg.content && (
                  <span className="inline-block w-0.5 h-3.5 bg-[#6B1E2B] ml-0.5 animate-pulse align-middle" />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {error && (
          <div className="flex items-center gap-2 text-xs text-[#A92B2B] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length <= 1 && (
        <div className="shrink-0 px-4 pb-2">
          <p className="text-[10px] uppercase tracking-wider text-[#999] mb-2">Suggested</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                disabled={isStreaming}
                className="text-[11px] bg-[#F5F1EA] hover:bg-[#EDE8DF] text-[#555] rounded-full px-2.5 py-1 transition-colors disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 p-3 border-t border-[#E5DDD2]">
        <div className="flex gap-2 items-center bg-[#F5F1EA] rounded-xl px-3 py-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask about this document…"
            disabled={isStreaming}
            className="flex-1 bg-transparent text-sm text-[#1E1E1E] placeholder:text-[#999] outline-none disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            className="w-7 h-7 rounded-lg bg-[#6B1E2B] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#7D2334] transition-colors shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
