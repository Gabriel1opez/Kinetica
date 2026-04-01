import { Server, Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import {
  GameRoom, Player, GamePhase, Planet, PlayerConfig, Potion,
} from './types';
import { DEFAULT_PLAYER_CONFIG, RECIPES } from './constants';
import { simulateRace } from './performanceEngine';

// ============================================================
// GAME MANAGER
// Manages game rooms, player state, and multiplayer coordination
// ============================================================

export class GameManager {
  private rooms = new Map<string, GameRoom>();
  private playerRooms = new Map<string, string>(); // socketId → roomCode
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  /** Generate a 6-character room code */
  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    // Ensure uniqueness
    if (this.rooms.has(code)) return this.generateCode();
    return code;
  }

  /** Create a new game room */
  createRoom(socket: Socket, playerName: string, avatar: number): string {
    const code = this.generateCode();
    const player: Player = {
      id: socket.id,
      name: playerName,
      avatar: avatar || 0,
      config: { ...DEFAULT_PLAYER_CONFIG, muscles: { ...DEFAULT_PLAYER_CONFIG.muscles }, energy: { ...DEFAULT_PLAYER_CONFIG.energy } },
      raceResults: [],
      totalTime: 0,
      isHost: true,
      isReady: false,
      currentPhase: 'lobby',
    };

    const room: GameRoom = {
      id: uuid(),
      code,
      hostId: socket.id,
      players: new Map([[socket.id, player]]),
      phase: 'lobby',
      currentPlanet: 'earth',
      currentPlayerIndex: 0,
      planetOrder: ['earth', 'mars', 'mercury'],
      createdAt: Date.now(),
    };

    this.rooms.set(code, room);
    this.playerRooms.set(socket.id, code);
    socket.join(code);

    return code;
  }

  /** Join an existing game room */
  joinRoom(socket: Socket, code: string, playerName: string, avatar: number): { success: boolean; error?: string } {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return { success: false, error: 'Room not found' };
    if (room.phase !== 'lobby') return { success: false, error: 'Game already started' };
    if (room.players.size >= 8) return { success: false, error: 'Room is full (max 8 players)' };

    const player: Player = {
      id: socket.id,
      name: playerName,
      avatar: avatar || 0,
      config: { ...DEFAULT_PLAYER_CONFIG, muscles: { ...DEFAULT_PLAYER_CONFIG.muscles }, energy: { ...DEFAULT_PLAYER_CONFIG.energy } },
      raceResults: [],
      totalTime: 0,
      isHost: false,
      isReady: false,
      currentPhase: 'lobby',
    };

    room.players.set(socket.id, player);
    this.playerRooms.set(socket.id, code.toUpperCase());
    socket.join(code.toUpperCase());

    // Notify all players
    this.emitRoomState(room);
    return { success: true };
  }

  /** Start the game (host only) */
  startGame(socketId: string): boolean {
    const room = this.getRoomForPlayer(socketId);
    if (!room || room.hostId !== socketId) return false;
    if (room.players.size < 1) return false; // Allow single player for testing

    room.phase = 'configuration';
    room.currentPlayerIndex = 0;
    this.emitRoomState(room);
    this.io.to(room.code).emit('game:phase-change', { phase: 'configuration' });
    return true;
  }

  /** Update player configuration */
  updateConfig(socketId: string, config: Partial<PlayerConfig>): void {
    const room = this.getRoomForPlayer(socketId);
    if (!room) return;

    const player = room.players.get(socketId);
    if (!player) return;

    // Validate muscle selection (max 3)
    if (config.muscles) {
      const selected = Object.values(config.muscles).filter(Boolean).length;
      if (selected > 3) return;
      player.config.muscles = config.muscles;
    }

    // Validate energy allocation (must sum to 100)
    if (config.energy) {
      const sum = config.energy.atpPc + config.energy.anaerobic + config.energy.aerobic;
      if (Math.abs(sum - 100) > 1) return;
      player.config.energy = config.energy;
    }

    if (config.mass !== undefined) {
      player.config.mass = Math.max(50, Math.min(120, config.mass));
    }

    if (config.potions !== undefined) {
      if (config.potions.length <= 3) {
        player.config.potions = config.potions;
      }
    }

    if (config.catapult) {
      player.config.catapult = {
        angle: Math.max(0, Math.min(90, config.catapult.angle)),
        force: Math.max(0, Math.min(100, config.catapult.force)),
      };
    }

    this.io.to(room.code).emit('player:config-update', {
      playerId: socketId,
      config: player.config,
    });
  }

  /** Mark player as ready for current phase */
  setReady(socketId: string, ready: boolean): void {
    const room = this.getRoomForPlayer(socketId);
    if (!room) return;

    const player = room.players.get(socketId);
    if (!player) return;
    player.isReady = ready;

    this.emitRoomState(room);

    // Check if all players are ready to advance
    const allReady = Array.from(room.players.values()).every(p => p.isReady);
    if (allReady) {
      this.advancePhase(room);
    }
  }

  /** Craft a potion from elements */
  craftPotion(socketId: string, elements: string[]): { success: boolean; potion?: Potion; error?: string } {
    const room = this.getRoomForPlayer(socketId);
    if (!room) return { success: false, error: 'Not in a room' };

    const player = room.players.get(socketId);
    if (!player) return { success: false, error: 'Player not found' };
    if (player.config.potions.length >= 3) return { success: false, error: 'Max 3 potions' };

    // Sort elements for matching
    const sorted = [...elements].sort();

    // Find matching recipe
    const recipe = RECIPES.find(r => {
      const recipeSorted = [...r.elements].sort();
      return recipeSorted.length === sorted.length &&
        recipeSorted.every((e, i) => e === sorted[i]);
    });

    if (!recipe) {
      return { success: false, error: 'Invalid combination — no reaction occurs!' };
    }

    // Check if already crafted this potion
    if (player.config.potions.some(p => p.name === recipe.potion.name)) {
      return { success: false, error: 'Already crafted this potion!' };
    }

    const potion: Potion = {
      id: uuid(),
      ...recipe.potion,
    };

    player.config.potions.push(potion);
    return { success: true, potion };
  }

  /** Run the race for a player */
  runRace(socketId: string): RaceResult | null {
    const room = this.getRoomForPlayer(socketId);
    if (!room) return null;

    const player = room.players.get(socketId);
    if (!player) return null;

    const result = simulateRace(player.config, room.currentPlanet);
    player.raceResults.push(result);
    player.totalTime += result.totalTime;

    return result;
  }

  /** Advance to the next game phase */
  private advancePhase(room: GameRoom): void {
    // Reset ready states
    room.players.forEach(p => p.isReady = false);

    const phaseOrder: GamePhase[] = [
      'lobby', 'configuration', 'potion-crafting', 'catapult', 'racing', 'results',
    ];

    const currentIdx = phaseOrder.indexOf(room.phase);

    if (room.phase === 'results') {
      // Move to next planet or final results
      const planetIdx = room.planetOrder.indexOf(room.currentPlanet);
      if (planetIdx < room.planetOrder.length - 1) {
        room.currentPlanet = room.planetOrder[planetIdx + 1];
        room.phase = 'catapult'; // Skip reconfiguration between planets, go straight to catapult
        room.currentPlayerIndex = 0;
      } else {
        room.phase = 'final-results';
      }
    } else if (currentIdx < phaseOrder.length - 1) {
      room.phase = phaseOrder[currentIdx + 1];
    }

    this.io.to(room.code).emit('game:phase-change', {
      phase: room.phase,
      planet: room.currentPlanet,
    });
    this.emitRoomState(room);
  }

  /** Move to next player's turn in racing */
  nextTurn(room: GameRoom): void {
    room.currentPlayerIndex++;
    const players = Array.from(room.players.values());

    if (room.currentPlayerIndex >= players.length) {
      // All players have raced, go to results
      room.currentPlayerIndex = 0;
      room.phase = 'results';
      this.io.to(room.code).emit('game:phase-change', { phase: 'results', planet: room.currentPlanet });
    } else {
      this.io.to(room.code).emit('game:next-turn', {
        currentPlayerId: players[room.currentPlayerIndex].id,
        playerIndex: room.currentPlayerIndex,
      });
    }

    this.emitRoomState(room);
  }

  /** Handle player disconnect */
  handleDisconnect(socketId: string): void {
    const room = this.getRoomForPlayer(socketId);
    if (!room) return;

    room.players.delete(socketId);
    this.playerRooms.delete(socketId);

    if (room.players.size === 0) {
      this.rooms.delete(room.code);
      return;
    }

    // Transfer host if needed
    if (room.hostId === socketId) {
      const newHost = room.players.values().next().value;
      if (newHost) {
        room.hostId = newHost.id;
        newHost.isHost = true;
      }
    }

    this.emitRoomState(room);
  }

  /** Get room for a player */
  getRoomForPlayer(socketId: string): GameRoom | undefined {
    const code = this.playerRooms.get(socketId);
    if (!code) return undefined;
    return this.rooms.get(code);
  }

  /** Emit current room state to all players */
  emitRoomState(room: GameRoom): void {
    const players = Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isHost: p.isHost,
      isReady: p.isReady,
      totalTime: p.totalTime,
      raceResults: p.raceResults,
      config: p.config,
    }));

    const playerOrder = Array.from(room.players.values());

    this.io.to(room.code).emit('room:state', {
      code: room.code,
      phase: room.phase,
      currentPlanet: room.currentPlanet,
      currentPlayerId: playerOrder[room.currentPlayerIndex]?.id || null,
      currentPlayerIndex: room.currentPlayerIndex,
      players,
    });
  }
}
