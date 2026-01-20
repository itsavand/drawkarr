import { db } from "./db";
import { rooms, players, messages, type Room, type Player, type CreateRoomRequest } from "@shared/schema";
import { eq, and, sql, asc } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface IStorage {
  createRoom(hostName: string, rounds?: number): Promise<{ room: Room; player: Player; sessionId: string }>;
  joinRoom(code: string, playerName: string): Promise<{ room: Room; player: Player; sessionId: string }>;
  getRoom(code: string): Promise<Room | undefined>;
  getRoomPlayers(roomId: number): Promise<Player[]>;
  getPlayer(sessionId: string): Promise<Player | undefined>;
  
  // Game Logic Methods
  updateRoomStatus(roomId: number, status: Room["status"], phaseEndTime?: Date): Promise<void>;
  updateRoomRound(roomId: number, round: number): Promise<void>;
  assignRoles(roomId: number, secretWord: string, liarId: number): Promise<void>;
  submitVote(playerId: number, targetId: number): Promise<void>;
  updateScore(playerId: number, points: number): Promise<void>;
  setReady(playerId: number, isReady: boolean): Promise<void>;
  resetRoom(roomId: number): Promise<void>;
  resetPlayersReady(roomId: number): Promise<void>;

  // Chat Methods
  addMessage(roomId: number, playerId: number, content: string): Promise<any>;
  getRoomMessages(roomId: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async createRoom(hostName: string, rounds: number = 1) {
    // Generate 4 letter code
    let code = "";
    do {
      code = randomBytes(2).toString("hex").toUpperCase();
    } while (await this.getRoom(code));

    const sessionId = randomBytes(16).toString("hex");

    const [room] = await db.insert(rooms).values({
      code,
      hostId: sessionId,
      status: "waiting",
      totalRounds: rounds,
      currentRound: 1,
    }).returning();

    const [player] = await db.insert(players).values({
      roomId: room.id,
      sessionId,
      name: hostName,
    }).returning();

    return { room, player, sessionId };
  }

  async getRoomMessages(roomId: number) {
    return db
      .select({
        id: messages.id,
        content: messages.content,
        createdAt: messages.createdAt,
        playerName: players.name,
        playerId: players.id,
      })
      .from(messages)
      .innerJoin(players, eq(messages.playerId, players.id))
      .where(eq(messages.roomId, roomId))
      .orderBy(asc(messages.createdAt));
  }

  async addMessage(roomId: number, playerId: number, content: string) {
    const [message] = await db
      .insert(messages)
      .values({ roomId, playerId, content })
      .returning();
    return message;
  }

  async updateRoomRound(roomId: number, round: number) {
    await db.update(rooms).set({ currentRound: round }).where(eq(rooms.id, roomId));
  }

  async updateScore(playerId: number, points: number) {
    await db.execute(sql`UPDATE players SET score = score + ${points}, last_score_at = NOW() WHERE id = ${playerId}`);
  }

  async setReady(playerId: number, isReady: boolean) {
    await db.update(players).set({ isReady }).where(eq(players.id, playerId));
  }

  async resetPlayersReady(roomId: number) {
    await db.update(players).set({ isReady: false, hasVoted: false }).where(eq(players.roomId, roomId));
  }

  async joinRoom(code: string, playerName: string) {
    const room = await this.getRoom(code);
    if (!room) throw new Error("Room not found");
    if (room.status !== "waiting") throw new Error("Game already started");

    const sessionId = randomBytes(16).toString("hex");

    const [player] = await db.insert(players).values({
      roomId: room.id,
      sessionId,
      name: playerName,
    }).returning();

    return { room, player, sessionId };
  }

  async getRoom(code: string) {
    const [room] = await db.select().from(rooms).where(eq(rooms.code, code));
    return room;
  }

  async getRoomPlayers(roomId: number) {
    return db.select().from(players).where(eq(players.roomId, roomId));
  }

  async getPlayer(sessionId: string) {
    const [player] = await db.select().from(players).where(eq(players.sessionId, sessionId));
    return player;
  }

  async updateRoomStatus(roomId: number, status: Room["status"], phaseEndTime?: Date) {
    await db.update(rooms)
      .set({ status, phaseEndTime })
      .where(eq(rooms.id, roomId));
  }

  async assignRoles(roomId: number, secretWord: string, liarId: number) {
    await db.update(rooms)
      .set({ secretWord, liarId })
      .where(eq(rooms.id, roomId));
      
    // Reset players for new round
    await db.update(players)
      .set({ isLiar: false, hasVoted: false, votedFor: null, isReady: false })
      .where(eq(players.roomId, roomId));

    // Set liar
    await db.update(players)
      .set({ isLiar: true })
      .where(and(eq(players.roomId, roomId), eq(players.id, liarId)));
  }

  async submitVote(playerId: number, targetId: number) {
    await db.update(players)
      .set({ hasVoted: true, votedFor: targetId })
      .where(eq(players.id, playerId));
  }

  async resetRoom(roomId: number) {
    await db.update(rooms)
      .set({ status: "waiting", secretWord: null, liarId: null, phaseEndTime: null })
      .where(eq(rooms.id, roomId));
    
    await db.update(players)
      .set({ isLiar: false, hasVoted: false, votedFor: null, isReady: false, score: 0 })
      .where(eq(players.roomId, roomId));
  }
  async removePlayer(sessionId: string) {
    const player = await this.getPlayer(sessionId);
    if (!player) return undefined;

    const room = await db.select().from(rooms).where(eq(rooms.id, player.roomId));
    if (room.length === 0) return undefined;

    await db.delete(players).where(eq(players.id, player.id));
    
    // If room is empty, optionally delete it or just return
    return { roomId: player.roomId, roomCode: room[0].code };
  }
}

export const storage = new DatabaseStorage();
