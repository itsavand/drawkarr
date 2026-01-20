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
      "text-cyan-400",
      "text-purple-400",
      "text-rose-400",
      "text-emerald-400",
      "text-amber-400",
      "text-indigo-400",
    ];
    return colors[playerId % colors.length];
  };

  const getGlowColor = (playerId: number) => {
    const glows = [
      "shadow-[0_0_10px_rgba(34,211,238,0.3)]",
      "shadow-[0_0_10px_rgba(192,132,252,0.3)]",
      "shadow-[0_0_10px_rgba(251,113,133,0.3)]",
      "shadow-[0_0_10px_rgba(52,211,153,0.3)]",
      "shadow-[0_0_10px_rgba(251,191,36,0.3)]",
      "shadow-[0_0_10px_rgba(129,140,248,0.3)]",
    ];
    return glows[playerId % glows.length];
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[95%] sm:max-w-md px-2 sm:px-4 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, scale: 0.95 }}
            animate={{ height: "calc(100vh - 120px)", maxHeight: "480px", opacity: 1, scale: 1 }}
            exit={{ height: 0, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 150 }}
            className="bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-primary/20 overflow-hidden flex flex-col mb-4 overscroll-none touch-none ring-1 ring-white/5"
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
            <div className="p-3 sm:p-4 border-b border-white/10 bg-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.2)]">
                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                </div>
                <div className="text-right" dir="rtl">
                  <h3 className="font-bold text-white text-xs sm:text-sm tracking-wide uppercase">چاتێ ژوورێ</h3>
                  <div className="flex items-center gap-1 sm:gap-1.5 justify-end">
                    <span className="text-[9px] sm:text-[10px] text-emerald-500 uppercase font-medium tracking-tighter">سەرهێڵ</span>
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="rounded-lg sm:rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all h-8 w-8 sm:h-10 sm:w-10"
              >
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 overflow-y-auto overscroll-contain" dir="rtl">
              <div className="p-3 sm:p-4 space-y-3 sm:y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/20 italic text-xs sm:text-sm py-16 sm:py-20 gap-2 sm:gap-3">
                    <Terminal className="w-6 h-6 sm:w-8 sm:h-8 opacity-20" />
                    پەیامەکێ بنڤیسە بۆ دەستپێکرنێ...
                  </div>
                ) : (
                  messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "flex flex-col gap-1 sm:gap-1.5",
                        msg.playerId === myPlayerId ? "items-start" : "items-start"
                      )}
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2 px-1">
                        <div className={cn(
                          "w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center bg-white/5 border border-white/10",
                          getGlowColor(msg.playerId)
                        )}>
                          {msg.playerId === 0 ? (
                            <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                          ) : (
                            <User className={cn("w-2.5 h-2.5 sm:w-3 sm:h-3", getPlayerColor(msg.playerId))} />
                          )}
                        </div>
                        <span className={cn(
                          "text-[10px] sm:text-[11px] font-bold uppercase tracking-wider",
                          getPlayerColor(msg.playerId)
                        )}>
                          {msg.playerName}
                        </span>
                        <span className="text-[8px] sm:text-[9px] text-white/30 font-medium">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={cn(
                        "bg-white/5 border border-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-sm hover:bg-white/10 transition-colors group max-w-[95%] sm:max-w-[90%]",
                        msg.playerId === myPlayerId ? "rounded-tr-none bg-primary/10 border-primary/20" : "rounded-tr-none"
                      )}>
                        <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
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
              className="p-3 sm:p-4 border-t border-white/10 bg-black/40 flex gap-2 shrink-0 items-center"
            >
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-lg sm:rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all hidden sm:flex h-9 w-9 sm:h-11 sm:w-11"
                >
                  <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="پەیامەکێ بنڤیسە..."
                className="rounded-lg sm:rounded-xl border-white/10 focus-visible:ring-primary/50 bg-white/5 h-10 sm:h-11 text-white placeholder:text-white/20 text-xs sm:text-sm text-right flex-1"
                dir="rtl"
              />
              <Button
                type="submit"
                disabled={!input.trim()}
                className="rounded-lg sm:rounded-xl bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none h-10 sm:h-11 px-3 sm:px-4"
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
            className="rounded-full px-6 sm:px-8 h-12 sm:h-14 shadow-[0_0_30px_rgba(var(--primary),0.3)] flex gap-2 sm:gap-3 font-bold text-base sm:text-lg bg-primary hover:bg-primary/90 border-2 border-primary/40 btn-bounce group relative overflow-hidden text-white"
          >
            <div className="relative z-10 flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                {messages.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-rose-500 rounded-full border-2 border-primary animate-pulse" />
                )}
              </div>
              <span>چات</span>
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-y-1 transition-transform" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
