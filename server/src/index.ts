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

  // RUN RACE
  socket.on('race:run', (_, callback) => {
    const result = gameManager.runRace(socket.id);
    if (result) {
      // Broadcast race result to all players
      const room = gameManager.getRoomForPlayer(socket.id);
      if (room) {
        io.to(room.code).emit('race:result', {
          playerId: socket.id,
          result,
        });
        // After a delay, advance to next turn
        setTimeout(() => {
          if (room) gameManager.nextTurn(room);
        }, 2000);
      }
    }
    callback({ success: !!result, result });
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
