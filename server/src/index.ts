import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { GameManager } from './game/gameManager';
import { ELEMENTS, RECIPES, PLANETS, MUSCLE_EFFECTS } from './game/constants';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://gabriel1opez.github.io',
    ],
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Serve static client build in production
const clientBuild = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuild));

// REST API for game data
app.get('/api/elements', (_req, res) => {
  res.json(ELEMENTS);
});

app.get('/api/recipes', (_req, res) => {
  res.json(RECIPES.map(r => ({
    elements: r.elements,
    potionName: r.potion.name,
    effect: r.potion.effect,
    description: r.potion.description,
  })));
});

app.get('/api/planets', (_req, res) => {
  res.json(PLANETS);
});

app.get('/api/muscles', (_req, res) => {
  res.json(MUSCLE_EFFECTS);
});

// Game Manager
const gameManager = new GameManager(io);

// Socket.IO event handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // CREATE ROOM
  socket.on('room:create', ({ playerName, avatar }, callback) => {
    const code = gameManager.createRoom(socket, playerName, avatar);
    const room = gameManager.getRoomForPlayer(socket.id);
    if (room) gameManager.emitRoomState(room);
    callback({ success: true, code });
  });

  // JOIN ROOM
  socket.on('room:join', ({ code, playerName, avatar }, callback) => {
    const result = gameManager.joinRoom(socket, code, playerName, avatar);
    callback(result);
  });

  // START GAME
  socket.on('game:start', (_, callback) => {
    const success = gameManager.startGame(socket.id);
    callback({ success });
  });

  // UPDATE CONFIG
  socket.on('player:update-config', (config) => {
    gameManager.updateConfig(socket.id, config);
  });

  // CRAFT POTION
  socket.on('player:craft-potion', ({ elements }, callback) => {
    const result = gameManager.craftPotion(socket.id, elements);
    callback(result);
  });

  // PLAYER READY
  socket.on('player:ready', ({ ready }) => {
    gameManager.setReady(socket.id, ready);
  });

  // RUN RACE (server-side science simulation — called at START of race)
  socket.on('race:run', (_, callback) => {
    const result = gameManager.runRace(socket.id);
    // Just return the science simulation result — do NOT advance turn
    // The client will send race:finish when the platformer is complete
    callback({ success: !!result, result });
  });

  // FINISH RACE (called when player finishes the platformer or times out)
  socket.on('race:finish', ({ platformTime }, callback) => {
    const room = gameManager.getRoomForPlayer(socket.id);
    if (room) {
      // Override the server-calculated time with the actual platform time
      const player = room.players.get(socket.id);
      if (player && player.raceResults.length > 0) {
        const lastResult = player.raceResults[player.raceResults.length - 1];
        // Recalculate total time using platform time
        player.totalTime -= lastResult.totalTime;
        lastResult.totalTime = platformTime;
        player.totalTime += platformTime;
      }

      // Broadcast that this player finished
      io.to(room.code).emit('race:player-finished', {
        playerId: socket.id,
        platformTime,
      });

      // Emit updated state so leaderboard reflects platform times
      gameManager.emitRoomState(room);

      // Advance to next player's turn
      setTimeout(() => {
        if (room) gameManager.nextTurn(room);
      }, 3000);
    }
    callback({ success: true });
  });

  // ADVANCE PHASE (host)
  socket.on('game:advance', () => {
    gameManager.setReady(socket.id, true);
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    gameManager.handleDisconnect(socket.id);
  });
});

// Catch-all for SPA routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientBuild, 'index.html'));
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Kinetica server running on port ${PORT}`);
});
