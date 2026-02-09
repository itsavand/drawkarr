import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

const CATEGORIES: Record<string, string[]> = {
  "گشتی": [
    "خيار", "مۆز", "شاحينه", "فیل", "ئاگر", "گیتار", "خانی", "طرشك", "دارستان", "به رنياس",
    "لێمۆن", "چیا", "قه له م", "ده ريا", "پیانۆ", "شاژن", "ڕۆکێت", "ڕۆژ", "پڵنگ", "ترومبيل",
    "کەمانچە", "نەهەنگ", "زەرافە", "یاخت", "زێبڕا", "تەیارە", "پرد", "قەلات", "بیابان", "ميسي",
    "دارستان", "باخچە", "چەکۆچ", "بەفر", "چاکێت", "ماسی", "مار", "مەدرەسە", "کورسیک", "کرستیانو",
    "پیزا", "لێفە", "ڕۆبۆت", "مار", "تەلەفۆن", "یونیکۆن", "ماموستا", "خەستە", "ئێکس-ڕەی", "یۆیۆ",
    "سندان", "گسک", "کاکتوس", "دۆلفین", "مەکینە", "نافوورە", "بەستەڵەک", "کڵاڤ", "جیا", "جیگساو",
    "کیبۆرد", "فانۆس", "ماگنێت", "بزمار", "واحە", "تەوتی", "تیردان", "تایرە", "برسی", "تەلەسکۆپ",
    "GTA", "جاما جیهانی", "سپانە", "بالوندور", "بیتزا", "دەبانجە", "لەنگەر", "بەرمیل", "قیبلەنما",
    "خەنجەر", "زێڕ", "واشە", "چاویلکە", "چەنگ", "میری", "الماس", "نوک", "برج خلیفە", "قایش",
    "تەبانە", "پارە", "کامیرە", "پێنوس", "دختور", "زلکی ددانا", "قازان", "باژێڕ", "مەنگەنە",
    "عەرەبانە", "تەبەڵ", "کۆل", "تام", "تەنەکا گلیشی", "کۆرە", "مشويات", "میشار", "شەحنا موبایلی",
    "داس", "مادی بێ هۆشکەر", "نوک"
  ],
  "خوارن": [
    "پیزا", "کەباب", "یاپراخ", "بریانی", "کۆتە لک", "ماسی", "شۆربە", "سەلاتە", "هێلکە", "شەربەت",
    "برنج", "نیسک", "گۆشت", "مریشک", "دۆلما", "نۆک", "نانی گەرم", "بامیە", "شەکر", "چای",
    "قەهوە", "بستەنی", "پاقلاوە", "کونافە", "هەنگوین", "پەنیر", "شیر", "ماست", "کەرە", "ڕۆن"
  ],
  "ئاژەڵ": [
    "شێر", "پڵنگ", "فیل", "زەرافە", "نەهەنگ", "دۆلفین", "مەیموون", "ئەسپ", "کەر", "گا",
    "پشیلە", "سەگ", "کەروێشک", "مار", "تەوتی", "داڵ", "قەل", "مریشک", "بزن", "مەڕ",
    "وشتر", "گورگ", "ڕێوی", "ورچ", "سەروو", "مێروولە", "هەنگ", "پەپوولە", "کیسەڵ", "قورواگ"
  ],
  "وەرزش": [
    "تەپاپێ", "تەپەسەلات", "مەلەوانی", "ڕاکردن", "بۆکسێن", "کاراتی", "جودۆ", "تێنیس", "تەپەهەوا", "باسکە",
    "ميسي", "کرستیانو", "ڕیاڵ مەدرید", "بەرشەلۆنە", "مۆندیال", "فیکە", "یاریگە", "گۆڵ", "ئۆڵۆمپیاد", "کراس",
    "چاکێت", "کڵاو", "سپۆرت", "جیم", "بازدان", "سەرکەفتن", "خەلات", "میدالیا", "کاپتن", "هاندەر"
  ]
};

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // REST APIs for room creation/joining (initial handshake)
  app.post(api.rooms.create.path, async (req, res) => {
    try {
      const { name, category, rounds } = api.rooms.create.input.parse(req.body);
      const result = await storage.createRoom(name, category, rounds);
      res.status(201).json({
        code: result.room.code,
        sessionId: result.sessionId,
        playerId: result.player.id,
        name: result.player.name
      });
    } catch (e) {
      console.error("Create Room Error:", e);
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.post(api.rooms.join.path, async (req, res) => {
    try {
      const { code, name } = api.rooms.join.input.parse(req.body);
      const result = await storage.joinRoom(code.toUpperCase(), name);
      res.status(200).json({
        code: result.room.code,
        sessionId: result.sessionId,
        playerId: result.player.id,
        name: result.player.name
      });
    } catch (e: any) {
      console.error("Join Room Error:", e);
      res.status(404).json({ message: e.message || "Room not found" });
    }
  });

  // WebSocket Setup
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Map sessionId -> WebSocket
  const clients = new Map<string, WebSocket>();
  // Map sessionId -> roomCode
  const sessions = new Map<string, string>();

  // Helper to broadcast state to a room
  async function broadcastRoomState(roomCode: string) {
    const room = await storage.getRoom(roomCode);
    if (!room) return;

    const players = await storage.getRoomPlayers(room.id);

    // Construct state
    const baseState = {
      room,
      players: players.map((p) => ({ ...p, isLiar: false })), // Hide liar info by default
      timeLeft: room.phaseEndTime
        ? Math.max(
            0,
            Math.ceil(
              (new Date(room.phaseEndTime).getTime() - Date.now()) / 1000,
            ),
          )
        : 0,
    };

    players.forEach((p) => {
      const ws = clients.get(p.sessionId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Customize state per player (reveal role)
        const playerState = {
          ...baseState,
          me: p,
          players: players.map((other) => ({
            ...other,
            isLiar: room.status === "finished" ? other.isLiar : undefined, // Only reveal at end
          })),
          room: {
            ...room,
            secretWord:
              p.isLiar && room.status !== "finished" ? null : room.secretWord, // Liar doesn't see word
          },
        };
        ws.send(JSON.stringify({ type: "state_update", state: playerState }));
      }
    });
  }

  // Helper to start the playing phase
  async function startPlayingPhase(
    roomId: number,
    roomCode: string,
    playersCount: number,
  ) {
    const room = await storage.getRoom(roomCode);
    const category = room?.category || "گشتی";
    const words = CATEGORIES[category] || CATEGORIES["گشتی"];
    const word = words[Math.floor(Math.random() * words.length)];
    const liarIndex = Math.floor(Math.random() * playersCount);

    const players = await storage.getRoomPlayers(roomId);
    const liarId = players[liarIndex].id;
    const phaseTime = new Date(Date.now() + 60000);

    await storage.assignRoles(roomId, word, liarId);
    await storage.updateRoomStatus(roomId, "playing", phaseTime);
    await broadcastRoomState(roomCode);

    // Set timeout to switch to voting
    setTimeout(async () => {
      const r = await storage.getRoom(roomCode);
      if (r && r.status === "playing") {
        await storage.updateRoomStatus(r.id, "voting");
        await broadcastRoomState(roomCode);
      }
    }, 60000);
  }

  wss.on("connection", (ws) => {
    let currentSessionId: string | null = null;
    let currentRoomCode: string | null = null;

    ws.on("message", async (data) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === "join" || msg.type === "reconnect") {
          const { sessionId, code } = msg;
          const player = await storage.getPlayer(sessionId);

          if (player) {
            currentSessionId = sessionId;
            currentRoomCode = code;
            clients.set(sessionId, ws);
            sessions.set(sessionId, code);
            
            // Send existing messages on join
            const room = await storage.getRoom(code);
            if (room) {
              const messages = await storage.getRoomMessages(room.id);
              ws.send(JSON.stringify({ type: 'chat_history', messages }));
            }
            
            await broadcastRoomState(code);
          } else {
            ws.send(JSON.stringify({ type: 'error', message: 'Session invalid or player not found' }));
          }
        }

        if (msg.type === "chat" && currentSessionId && currentRoomCode) {
          const room = await storage.getRoom(currentRoomCode);
          const player = await storage.getPlayer(currentSessionId);
          if (room && player) {
            const message = await storage.addMessage(room.id, player.id, msg.content);
            const chatMsg = {
              type: 'chat_message',
              message: {
                id: message.id,
                content: message.content,
                createdAt: message.createdAt,
                playerName: player.name,
                playerId: player.id
              }
            };
            
            // Broadcast to all players in the room
            const roomPlayers = await storage.getRoomPlayers(room.id);
            roomPlayers.forEach(p => {
              const clientWs = clients.get(p.sessionId);
              if (clientWs && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify(chatMsg));
              }
            });
          }
        }

        if (msg.type === "start_game" && currentSessionId && currentRoomCode) {
          const room = await storage.getRoom(currentRoomCode);
          if (room && room.hostId === currentSessionId) {
            const players = await storage.getRoomPlayers(room.id);
            await startPlayingPhase(room.id, currentRoomCode, players.length);
          }
        }

        if (msg.type === "vote" && currentSessionId && currentRoomCode) {
          const player = await storage.getPlayer(currentSessionId);
          if (player && !player.hasVoted) {
            await storage.submitVote(player.id, msg.targetId);
            const room = await storage.getRoom(currentRoomCode);
            const players = await storage.getRoomPlayers(room!.id);

            if (players.every((p) => p.hasVoted)) {
              // Calculate results
              const liarId = room!.liarId;
              const liarVotes = players.filter(p => (p as any).votedFor === liarId).length;
              const nonLiarCount = players.length - 1;

              if (liarVotes > nonLiarCount / 2) {
                // Liar caught - everyone else gets points
                for (const p of players) {
                  if (!p.isLiar) await storage.updateScore(p.id, 3);
                }
              } else {
                // Liar escaped - liar gets points
                if (liarId) await storage.updateScore(liarId, 5);
              }
              
              await storage.updateRoomStatus(room!.id, "finished");
            }
            await broadcastRoomState(currentRoomCode);
          }
        }

        if (msg.type === "ready" && currentSessionId && currentRoomCode) {
          const player = await storage.getPlayer(currentSessionId);
          if (player) {
            await storage.setReady(player.id, true);
            const room = await storage.getRoom(currentRoomCode);
            const players = await storage.getRoomPlayers(room!.id);

            if (players.every((p) => p.isReady)) {
              if (room!.currentRound < room!.totalRounds) {
                await storage.updateRoomRound(room!.id, room!.currentRound + 1);
                await storage.resetPlayersReady(room!.id);
                await startPlayingPhase(
                  room!.id,
                  currentRoomCode,
                  players.length,
                );
              } else {
                await storage.updateRoomStatus(room!.id, "finished");
              }
            }
            await broadcastRoomState(currentRoomCode);
          }
        }

        if (msg.type === "play_again" && currentSessionId && currentRoomCode) {
          const room = await storage.getRoom(currentRoomCode);
          if (room && room.hostId === currentSessionId) {
            await storage.resetRoom(room.id);
            await broadcastRoomState(currentRoomCode);
          }
        }

        if (msg.type === "leave" && currentSessionId) {
          const result = await storage.removePlayer(currentSessionId);
          if (result) {
            clients.delete(currentSessionId);
            sessions.delete(currentSessionId);
            
            const remainingPlayers = await storage.getRoomPlayers(result.roomId);
            const room = await storage.getRoom(result.roomCode);
            
            if (room && room.status !== "waiting" && remainingPlayers.length < 3) {
              await storage.updateRoomStatus(result.roomId, "finished");
              // We could add a special flag or message here if needed, 
              // but we'll handle the UI based on player count and status
            }
            
            await broadcastRoomState(result.roomCode);
          }
        }
      } catch (e) {
        console.error("WS Message Error", e);
      }
    });

    ws.on("close", () => {
      if (currentSessionId) {
        clients.delete(currentSessionId);
      }
    });
  });

  return httpServer;
}
