import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGame } from "@/hooks/use-game";
import { Loader2, Copy, Share2, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PlayerList } from "@/components/PlayerList";
import { RoleCard } from "@/components/RoleCard";
import { PhaseTimer } from "@/components/PhaseTimer";
import { GameCard } from "@/components/GameCard";
import { Chat } from "@/components/Chat";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Room() {
  const [, params] = useRoute("/room/:code");
  const [, setLocation] = useLocation();
  const { gameState, connected, startGame, votePlayer, playAgain, setReady, messages, sendChatMessage, leaveRoom } =
    useGame();
  const { toast } = useToast();

  const code = params?.code;

  // Redirect if no game state (connection lost/invalid)
  useEffect(() => {
    if (!connected && !gameState) {
      const timer = setTimeout(() => {
        // If we have a stored session, useGame will try to reconnect
        // But if that fails, we go home
        if (!gameState) {
          setLocation("/");
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [connected, gameState, setLocation]);

  const copyCode = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "لینک هاتە کۆپیکرن!",
      description: "ل گەل هەڤالێن خۆ پارڤە بکە.",
    });
  };

  const shareCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "بەشداری یاریا درەوکەر بکە!",
          text: `بەشداری ژوورا من بکە ب کۆدێ: ${code}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      copyCode();
    }
  };

  // Trigger confetti on win
  useEffect(() => {
    if (gameState?.room.status === "finished") {
      const duration = 3000;
      const end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#ff0000", "#00ff00", "#0000ff"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#ff0000", "#00ff00", "#0000ff"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [gameState?.room.status]);

  if (!gameState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-bold text-muted-foreground">
          پەیوەندی دێتە چێکرن...
        </h2>
      </div>
    );
  }

  const me = gameState.me;
  const isHost = gameState.players[0]?.id === me?.id;
  const status = gameState.room.status;
  const winner = gameState.players.reduce((prev, current) => {
    const currentScore = current.score || 0;
    const prevScore = prev.score || 0;
    if (currentScore > prevScore) return current;
    if (currentScore === prevScore) {
      if (current.lastScoreAt && prev.lastScoreAt) {
        return new Date(current.lastScoreAt).getTime() <
          new Date(prev.lastScoreAt).getTime()
          ? current
          : prev;
      }
    }
    return prev;
  });

  return (
    <div className="min-h-screen pb-24 p-4 md:p-8 max-w-5xl mx-auto" dir="rtl">
      {/* Persistent Toggleable Chat (Visible in all phases) */}
      <Chat 
        messages={messages} 
        onSendMessage={sendChatMessage} 
        myPlayerId={me?.id} 
      />

      {/* Header */}
      <header className="flex justify-between items-center mb-8 bg-white/50 backdrop-blur-sm p-4 rounded-2xl sticky top-4 z-10 shadow-sm border border-white/20">
        <div className="flex flex-col text-right">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            کۆدێ ژوورێ
          </span>
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={copyCode}
          >
            <span className="text-3xl font-black font-mono text-primary tracking-widest">
              {gameState.room.code}
            </span>
            <Copy className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-left">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              یاریزان
            </div>
            <span className="text-2xl font-black text-gray-800">
              {gameState.players.length}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Settings className="w-6 h-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive gap-2"
                onClick={leaveRoom}
              >
                <LogOut className="w-4 h-4" />
                <span>دەرکەفتن</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {/* === WAITING ROOM === */}
        {status === "waiting" && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-4xl font-black text-gray-800">
                ل هیڤیا یاریزانان
              </h2>
              <p className="text-lg text-muted-foreground">
                کۆدی بلاف بکە دا هەڤالێن تە بهێن!
              </p>
              <Button
                variant="outline"
                className="mt-4 gap-2 rounded-xl"
                onClick={shareCode}
              >
                <Share2 className="w-4 h-4" /> بڵاوکردنەوە
              </Button>
            </div>

            <PlayerList
              players={gameState.players}
              myPlayerId={me?.id}
              phase={status}
            />

            {isHost ? (
              <div className="fixed bottom-8 left-0 right-0 px-4 flex justify-center">
                <Button
                  size="lg"
                  className="w-full max-w-md h-16 text-2xl font-bold rounded-2xl shadow-xl shadow-primary/30 btn-bounce"
                  onClick={startGame}
                  disabled={gameState.players.length < 3}
                >
                  {gameState.players.length < 3
                    ? "٣+ یاریزان پێدڤینە"
                    : "دەستپێبکە!"}
                </Button>
              </div>
            ) : (
              <div className="text-center mt-12 p-6 bg-white/50 rounded-2xl animate-pulse">
                <p className="font-bold text-primary">
                  ل هیڤیا خودانێ ژوورێ...
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* === PLAYING PHASE === */}
        {status === "playing" && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8 flex flex-col items-center"
          >
            <PhaseTimer
              endTime={
                gameState.room.phaseEndTime
                  ? new Date(gameState.room.phaseEndTime).toISOString()
                  : null
              }
              totalDuration={60}
            />

            <RoleCard
              isLiar={!!me?.isLiar}
              secretWord={gameState.room.secretWord || "???"}
            />

            <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border-2 border-primary/10 max-w-md text-center">
              <h3 className="text-xl font-bold mb-2">ڕێنمایی</h3>
              {me?.isLiar ? (
                <p>
                  تۆ درەوکەری! گوهێ خۆ بدە یاریزانێن دی کا چەوا پەیڤێ وەسف دکەن.
                  هەوڵ بدە خۆ تێکەڵ بکەی!
                </p>
              ) : (
                <p>
                  پەیڤا نهێنی ب هۆشیاری وەسف بکە! زۆرا ڕوون نەبێ دا درەوکەر
                  نەزانیت، و زۆرا مژاوی نەبێ دا گۆمان ل تە نەکەن!
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* === VOTING PHASE === */}
        {status === "voting" && (
          <motion.div
            key="voting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-4xl font-black text-destructive animate-pulse">
                درەوکەر کییە؟
              </h2>
              <p className="text-lg text-muted-foreground mt-2">
                کلیکێ ل سەر یاریزانەکێ بکە دا دەنگی بدەیێ!
              </p>
            </div>

            <PhaseTimer
              endTime={
                gameState.room.phaseEndTime
                  ? new Date(gameState.room.phaseEndTime).toISOString()
                  : null
              }
              totalDuration={30}
              className="mb-8"
            />

            <PlayerList
              players={gameState.players}
              showVotes
              onVote={votePlayer}
              myPlayerId={me?.id}
              phase={status}
            />

            {me?.hasVoted && (
              <div className="fixed bottom-8 left-0 right-0 px-4 text-center">
                <div className="inline-block bg-primary text-white px-6 py-3 rounded-full font-bold shadow-lg">
                  دەنگ هاتە وەرگرتن! ل هیڤیا یاریزانێن دی...
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* === RESULTS PHASE === */}
        {status === "finished" && (
          <motion.div
            key="finished"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8 text-center"
          >
            <div className="mb-4">
              <span className="text-sm font-bold bg-primary/10 text-primary px-4 py-2 rounded-full uppercase tracking-widest">
                پەیڤا {gameState.room.currentRound} ژ{" "}
                {gameState.room.totalRounds}
              </span>
            </div>

            <GameCard className="bg-white/95">
              <div className="space-y-6">
                <div className="text-6xl mb-4">
                  {gameState.room.currentRound >= gameState.room.totalRounds
                    ? "👑"
                    : gameState.room.liarId &&
                        gameState.players.find(
                          (p) => p.id === gameState.room.liarId,
                        )?.score
                      ? "😈"
                      : "🏆"}
                </div>

                <h1 className="text-5xl font-black text-primary">
                  {gameState.room.currentRound >= gameState.room.totalRounds
                    ? `سەرکەفتی: ${winner.name}`
                    : "دوماهیا رۆندی"}
                </h1>

                <div className="bg-muted p-6 rounded-2xl">
                  <p className="text-sm font-bold text-muted-foreground uppercase">
                    درەوکەر ئەڤە بوو
                  </p>
                  <p className="text-3xl font-black text-destructive mt-1">
                    {gameState.players.find(
                      (p) => p.id === gameState.room.liarId,
                    )?.name || "نەدیار"}
                  </p>
                </div>

                <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                  <p className="text-sm font-bold text-green-700 uppercase">
                    پەیڤا نهێنی ئەڤە بوو
                  </p>
                  <p className="text-3xl font-black text-green-800 mt-1">
                    {gameState.room.secretWord}
                  </p>
                </div>
              </div>
            </GameCard>

            <div className="pt-4">
              <h3 className="text-xl font-bold mb-4">خاڵ (Scores)</h3>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                {gameState.players
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center py-3 border-b last:border-0 border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-gray-400 w-6">
                          #{idx + 1}
                        </span>
                        <span className="font-bold">{p.name}</span>
                        {p.isLiar && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            درەوکەر
                          </span>
                        )}
                        {p.isReady && (
                          <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-black uppercase">
                            به رهه فم
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-primary">
                        {p.score} خاڵ
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="fixed bottom-8 left-0 right-0 px-4 flex justify-center gap-4">
              {gameState.room.currentRound >= gameState.room.totalRounds ? (
                <>
                  {isHost ? (
                    <Button
                      size="lg"
                      className="w-full max-w-md h-16 text-2xl font-bold rounded-2xl shadow-xl shadow-primary/30 btn-bounce"
                      onClick={playAgain}
                    >
                      دووبارە یاری بکە
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full max-w-md h-16 text-2xl font-bold rounded-2xl border-2"
                      onClick={() => setLocation("/")}
                    >
                      دەرکەفتن
                    </Button>
                  )}
                </>
              ) : !me?.isReady ? (
                <Button
                  size="lg"
                  className="w-full max-w-md h-16 text-2xl font-bold rounded-2xl shadow-xl shadow-primary/30 btn-bounce"
                  onClick={setReady}
                >
                  ئەز به رهه فم بۆ یا دی
                </Button>
              ) : (
                <div className="w-full max-w-md h-16 flex items-center justify-center bg-green-100 text-green-700 font-bold rounded-2xl border-2 border-green-200">
                  ل هیڤیا یاریزانێن دی...
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
