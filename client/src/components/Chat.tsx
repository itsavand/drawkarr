import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Send, MessageSquare, ChevronDown, ChevronUp, User, Shield, Terminal, Smile, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  content: string;
  playerName: string;
  playerId: number;
  createdAt: string;
}

interface ChatProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  myPlayerId?: number;
}

export function Chat({ messages, onSendMessage, myPlayerId }: ChatProps) {
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const getPlayerColor = (playerId: number) => {
    const colors = [
      "text-primary",
      "text-secondary",
      "text-rose-500",
      "text-emerald-500",
      "text-amber-500",
      "text-blue-500",
    ];
    return colors[playerId % colors.length];
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[95%] sm:max-w-md px-2 sm:px-4 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: 20 }}
            animate={{ height: "calc(100vh - 120px)", maxHeight: "480px", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: 20 }}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-border overflow-hidden flex flex-col mb-4 overscroll-none touch-none"
            style={{ 
              position: 'absolute', 
              bottom: '100%', 
              left: '0', 
              right: '0', 
              maxWidth: '100%', 
              margin: '0 auto',
              marginBottom: '0.5rem'
            }}
          >
            {/* Header */}
            <div className="p-3 sm:p-4 border-b bg-primary/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                </div>
                <div className="text-right" dir="rtl">
                  <h3 className="font-bold text-foreground text-xs sm:text-sm tracking-wide uppercase">چاتێ ژوورێ</h3>
                  <div className="flex items-center gap-1 sm:gap-1.5 justify-end">
                    <span className="text-[9px] sm:text-[10px] text-emerald-600 uppercase font-bold tracking-tighter">سەرهێڵ</span>
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="rounded-lg sm:rounded-xl hover:bg-black/5 text-muted-foreground transition-all h-8 w-8 sm:h-10 sm:w-10"
              >
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 overflow-y-auto overscroll-contain bg-slate-50/50" dir="rtl">
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 italic text-xs sm:text-sm py-16 sm:py-20 gap-2 sm:gap-3">
                    <Terminal className="w-6 h-6 sm:w-8 sm:h-8 opacity-20" />
                    پەیامەکێ بنڤیسە بۆ دەستپێکرنێ...
                  </div>
                ) : (
                  messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex flex-col gap-1 sm:gap-1.5"
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2 px-1">
                        <span className={cn(
                          "text-[10px] sm:text-[11px] font-bold uppercase tracking-wider",
                          getPlayerColor(msg.playerId)
                        )}>
                          {msg.playerName}
                        </span>
                        <span className="text-[8px] sm:text-[9px] text-muted-foreground font-medium">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={cn(
                        "rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-sm transition-colors max-w-[95%] sm:max-w-[90%]",
                        msg.playerId === myPlayerId 
                          ? "bg-primary text-primary-foreground rounded-tr-none" 
                          : "bg-white border border-border text-foreground rounded-tr-none"
                      )}>
                        <p className="text-xs sm:text-sm leading-relaxed">
                          {msg.content}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input Bar */}
            <form
              onSubmit={handleSubmit}
              className="p-3 sm:p-4 border-t bg-white flex gap-2 shrink-0 items-center"
            >
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-lg sm:rounded-xl hover:bg-black/5 text-muted-foreground transition-all hidden sm:flex h-9 w-9 sm:h-11 sm:w-11"
                >
                  <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="پەیامەکێ بنڤیسە..."
                className="rounded-lg sm:rounded-xl border-input focus-visible:ring-primary/50 bg-slate-100 h-10 sm:h-11 text-foreground placeholder:text-muted-foreground/50 text-xs sm:text-sm text-right flex-1"
                dir="rtl"
              />
              <Button
                type="submit"
                disabled={!input.trim()}
                className="rounded-lg sm:rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-md transition-all active:scale-95 disabled:opacity-50 h-10 sm:h-11 px-3 sm:px-4"
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex justify-center"
        >
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="rounded-full px-6 sm:px-8 h-12 sm:h-14 shadow-lg flex gap-2 sm:gap-3 font-bold text-base sm:text-lg bg-primary hover:bg-primary/90 text-white btn-bounce relative overflow-hidden"
          >
            <div className="relative z-10 flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                {messages.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-secondary rounded-full border-2 border-primary animate-pulse" />
                )}
              </div>
              <span>چات</span>
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </Button>
        </motion.div>
      )}
    </div>
  );
}
