import { useState } from "react";
import { MessageSquare, X, Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AIAuditorWidget({ documentId }: { documentId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your Privacy Auditor. Ask me anything about the current document's redactions or remaining risks." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput("");
    const newHistory: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auditor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          message: userMsg,
          history: messages.filter(m => m.role !== "assistant" || messages.indexOf(m) > 0) // optional, skipping first hello
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages([...newHistory, { role: "assistant", content: data.content }]);
    } catch (e: any) {
      setMessages([...newHistory, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-[#6B1E2B] hover:bg-[#7D2334] text-white z-50"
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-80 md:w-96 bg-[#FFFDF9] border border-[#E5DDD2] shadow-2xl rounded-2xl z-50 flex flex-col overflow-hidden"
            style={{ height: '500px' }}
          >
            <div className="bg-[#6B1E2B] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <span className="font-serif font-medium">Privacy Auditor</span>
              </div>
              <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-white/20 rounded-full" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <ScrollArea className="flex-1 p-4 bg-[#F5F1EA]/50">
              <div className="flex flex-col gap-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                    <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-[#E5DDD2]' : 'bg-[#6B1E2B] text-white'}`}>
                      {m.role === 'user' ? <User className="h-4 w-4 text-[#666]" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-[#FFFDF9] border border-[#E5DDD2] text-[#1E1E1E]' : 'bg-white shadow-sm border border-[#E5DDD2] text-[#333]'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="self-start flex gap-3 max-w-[85%]">
                    <div className="shrink-0 h-8 w-8 rounded-full bg-[#6B1E2B] text-white flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="p-3 rounded-2xl bg-white shadow-sm border border-[#E5DDD2] flex gap-1 items-center">
                      <span className="h-2 w-2 bg-[#6B1E2B]/50 rounded-full animate-bounce" />
                      <span className="h-2 w-2 bg-[#6B1E2B]/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="h-2 w-2 bg-[#6B1E2B]/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-3 bg-white border-t border-[#E5DDD2]">
              <form 
                onSubmit={e => { e.preventDefault(); sendMessage(); }}
                className="flex items-center gap-2"
              >
                <Input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  placeholder="Ask a question..." 
                  className="bg-[#F5F1EA] border-none focus-visible:ring-1 focus-visible:ring-[#6B1E2B]"
                />
                <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="shrink-0 bg-[#6B1E2B] hover:bg-[#7D2334] text-white rounded-full">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
