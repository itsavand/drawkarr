import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  hostId: text("host_id").notNull(),
  status: text("status", { enum: ["waiting", "playing", "voting", "finished"] }).notNull().default("waiting"),
  category: text("category").notNull().default("گشتی"),
  secretWord: text("secret_word"),
  liarId: integer("liar_id"),
  totalRounds: integer("total_rounds").notNull().default(1),
  currentRound: integer("current_round").notNull().default(1),
  phaseEndTime: timestamp("phase_end_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  sessionId: text("session_id").notNull(),
  name: text("name").notNull(),
  isLiar: boolean("is_liar").default(false),
  hasVoted: boolean("has_voted").default(false),
  votedFor: integer("voted_for"),
  isReady: boolean("is_ready").default(false),
  score: integer("score").default(0),
  lastScoreAt: timestamp("last_score_at"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  playerId: integer("player_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const roomsRelations = relations(rooms, ({ many }) => ({
  players: many(players),
  messages: many(messages),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  room: one(rooms, {
    fields: [players.roomId],
    references: [rooms.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  room: one(rooms, {
    fields: [messages.roomId],
    references: [rooms.id],
  }),
  player: one(players, {
    fields: [messages.playerId],
    references: [players.id],
  }),
}));

// === SCHEMAS ===

export const insertRoomSchema = createInsertSchema(rooms).omit({ 
  id: true, 
  createdAt: true, 
  phaseEndTime: true,
  secretWord: true,
  liarId: true 
}).extend({
  category: z.string().min(1, "پێدڤی ب دیارکرنا جورێ پەیڤانە"),
  rounds: z.number().min(1).max(5)
});

export const insertPlayerSchema = createInsertSchema(players).omit({ 
  id: true, 
  joinedAt: true,
  isLiar: true,
  hasVoted: true,
  score: true 
});

// === API TYPES ===

export type Room = typeof rooms.$inferSelect;
export type Player = typeof players.$inferSelect;

export type CreateRoomRequest = {
  hostName: string;
};

export type JoinRoomRequest = {
  code: string;
  name: string;
};

export type GameState = {
  room: Room;
  players: Player[];
  me: Player | undefined;
  timeLeft: number; // calculated on server or client
};

// WebSocket Messages
export type WsMessage = 
  | { type: 'join'; code: string; name: string; sessionId: string }
  | { type: 'reconnect'; code: string; sessionId: string }
  | { type: 'chat'; content: string }
  | { type: 'chat_history'; messages: any[] }
  | { type: 'chat_message'; message: any }
  | { type: 'start_game' }
  | { type: 'vote'; targetId: number }
  | { type: 'play_again' }
  | { type: 'ready' }
  | { type: 'state_update'; state: GameState }
  | { type: 'error'; message: string };
