import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Crown, HelpCircle } from "lucide-react";
import type { Player } from "@shared/schema";
import { cn } from "@/lib/utils";

interface PlayerListProps {
  players: Player[];
  showVotes?: boolean;
  onVote?: (playerId: number) => void;
  myPlayerId?: number;
  phase: string;
}

export function PlayerList({ players, showVotes = false, onVote, myPlayerId, phase }: PlayerListProps) {
  // Generate a deterministic color for avatars
  const getAvatarColor = (name: string) => {
    const colors = ['bg-red-100 text-red-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-yellow-100 text-yellow-600', 'bg-purple-100 text-purple-600', 'bg-pink-100 text-pink-600'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const hasVoted = (player: Player) => player.hasVoted;
  const canVote = phase === 'voting' && !players.find(p => p.id === myPlayerId)?.hasVoted;

  // Stable sorting: host first, then by ID to prevent jumping
  const sortedPlayers = [...players].sort((a, b) => {
    // If we are in voting phase, we keep a fixed order based on join time (id)
    // In waiting room, host (idx 0) is usually first, but let's stick to ID for absolute stability
    return a.id - b.id;
  });

  return (
    <div className="flex flex-col gap-3 w-full max-w-2xl mx-auto">
      {sortedPlayers.map((player, idx) => (
        <motion.div
          key={player.id}
          layout
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => {
            if (canVote && onVote && player.id !== myPlayerId) {
              onVote(player.id);
            }
          }}
          className={cn(
            "relative p-3 rounded-2xl border-2 flex items-center gap-4 bg-white shadow-sm transition-all",
            canVote && player.id !== myPlayerId 
              ? "cursor-pointer hover:border-primary hover:shadow-md active:scale-[0.98]" 
              : "border-transparent",
            player.id === myPlayerId && "border-primary/20 bg-primary/5 ring-2 ring-primary/10"
          )}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="w-12 h-12 border-2 border-white shadow-sm shrink-0">
              <AvatarFallback className={cn("text-lg font-bold", getAvatarColor(player.name))}>
                {player.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col text-right flex-1 min-w-0">
              <div className="flex items-center gap-2 justify-end">
                {player.id === myPlayerId && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    تۆ
                  </span>
                )}
                {idx === 0 && phase === 'waiting' && (
                  <Crown className="w-4 h-4 text-yellow-500" />
                )}
                <p className="font-bold text-gray-800 truncate">{player.name}</p>
              </div>
              <p className="text-xs text-gray-500 font-semibold">{player.score} خاڵ</p>
            </div>
          </div>

          <div className="flex items-center gap-1 min-w-[40px] justify-end">
            {phase === 'voting' && hasVoted(player) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-green-500 text-white rounded-full p-1 shadow-sm"
              >
                <Check className="w-4 h-4" />
              </motion.div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
