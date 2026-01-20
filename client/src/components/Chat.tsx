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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, scale: 0.95 }}
            animate={{ height: "480px", opacity: 1, scale: 1 }}
            exit={{ height: 0, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 150 }}
            className="bg-slate-950/80 backdrop-blur-xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col mb-4 overscroll-none touch-none ring-1 ring-white/5"
            style={{ 
              position: 'absolute', 
              bottom: '100%', 
              left: '0', 
              right: '0', 
              maxWidth: '100%', 
              margin: '0 auto',
              marginBottom: '1rem'
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-right" dir="rtl">
                  <h3 className="font-bold text-white text-sm tracking-wide uppercase">چاتێ ژوورێ</h3>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-[10px] text-emerald-500 uppercase font-medium tracking-tighter">سەرهێڵ</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all"
              >
                <ChevronDown className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 overflow-y-auto overscroll-contain" dir="rtl">
              <div className="p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/20 italic text-sm py-20 gap-3">
                    <Terminal className="w-8 h-8 opacity-20" />
                    پەیامەکێ بنڤیسە بۆ دەستپێکرنێ...
                  </div>
                ) : (
                  messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "flex flex-col gap-1.5",
                        msg.playerId === myPlayerId ? "items-start" : "items-start"
                      )}
                    >
                      <div className="flex items-center gap-2 px-1">
                        <div className={cn(
                          "w-6 h-6 rounded-lg flex items-center justify-center bg-white/5 border border-white/10",
                          getGlowColor(msg.playerId)
                        )}>
                          {msg.playerId === 0 ? (
                            <Shield className="w-3 h-3 text-amber-400" />
                          ) : (
                            <User className={cn("w-3 h-3", getPlayerColor(msg.playerId))} />
                          )}
                        </div>
                        <span className={cn(
                          "text-[11px] font-bold uppercase tracking-wider",
                          getPlayerColor(msg.playerId)
                        )}>
                          {msg.playerName}
                        </span>
                        <span className="text-[9px] text-white/30 font-medium">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={cn(
                        "bg-white/5 border border-white/5 backdrop-blur-sm rounded-2xl p-3 shadow-sm hover:bg-white/10 transition-colors group max-w-[90%]",
                        msg.playerId === myPlayerId ? "rounded-tr-none bg-cyan-500/10 border-cyan-500/20" : "rounded-tr-none"
                      )}>
                        <p className="text-white/90 text-sm leading-relaxed">
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
              className="p-4 border-t border-white/10 bg-black/40 flex gap-2 shrink-0 items-center"
            >
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all hidden sm:flex"
                >
                  <Smile className="w-5 h-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-xl hover:bg-white/10 text-white/20 cursor-not-allowed transition-all"
                  disabled
                >
                  <MicOff className="w-5 h-5" />
                </Button>
              </div>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="پەیامەکێ بنڤیسە..."
                className="rounded-xl border-white/10 focus-visible:ring-cyan-500/50 bg-white/5 h-11 text-white placeholder:text-white/20 text-sm text-right"
                dir="rtl"
              />
              <Button
                type="submit"
                disabled={!input.trim()}
                className="rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
              >
                <Send className="w-4 h-4" />
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
            className="rounded-full px-8 h-14 shadow-[0_0_30px_rgba(6,182,212,0.3)] flex gap-3 font-bold text-lg bg-cyan-600 hover:bg-cyan-500 border-2 border-cyan-400 btn-bounce group relative overflow-hidden text-white"
          >
            <div className="relative z-10 flex items-center gap-3">
              <div className="relative">
                <MessageSquare className="w-6 h-6" />
                {messages.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-cyan-600 animate-pulse" />
                )}
              </div>
              <span>چات</span>
              <ChevronUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
