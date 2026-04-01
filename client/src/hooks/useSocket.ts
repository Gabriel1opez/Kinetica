import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface PlayerData {
  id: string;
  name: string;
  avatar: number;
  isHost: boolean;
  isReady: boolean;
  totalTime: number;
  raceResults: any[];
  config: any;
}

export interface RoomState {
  code: string;
  phase: string;
  currentPlanet: string;
  currentPlayerId: string | null;
  currentPlayerIndex: number;
  players: PlayerData[];
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [raceResult, setRaceResult] = useState<any>(null);
  const [otherPlayers, setOtherPlayers] = useState<Record<string, { x: number; y: number; state: string; facing: number; name: string; avatar: number }>>({});

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL ||
      (window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin);

    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setPlayerId(socket.id || '');
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('room:state', (state: RoomState) => {
      setRoomState(state);
    });

    socket.on('game:phase-change', (data: { phase: string; planet?: string }) => {
      setRoomState(prev => prev ? { ...prev, phase: data.phase, currentPlanet: data.planet || prev.currentPlanet } : null);
    });

    socket.on('game:next-turn', (data: { currentPlayerId: string; playerIndex: number }) => {
      setRoomState(prev => prev ? {
        ...prev,
        currentPlayerId: data.currentPlayerId,
        currentPlayerIndex: data.playerIndex,
      } : null);
    });

    socket.on('race:result', (data: { playerId: string; result: any }) => {
      setRaceResult(data);
    });

    socket.on('race:player-finished', (data: { playerId: string; platformTime: number }) => {
      setRaceResult(data);
    });

    socket.on('race:player-position', (data: { playerId: string; x: number; y: number; state: string; facing: number }) => {
      setOtherPlayers(prev => ({
        ...prev,
        [data.playerId]: { x: data.x, y: data.y, state: data.state, facing: data.facing, name: '', avatar: 0 },
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = useCallback((playerName: string, avatar: number): Promise<{ success: boolean; code?: string }> => {
    return new Promise((resolve) => {
      socketRef.current?.emit('room:create', { playerName, avatar }, resolve);
    });
  }, []);

  const joinRoom = useCallback((code: string, playerName: string, avatar: number): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      socketRef.current?.emit('room:join', { code, playerName, avatar }, resolve);
    });
  }, []);

  const startGame = useCallback((): Promise<{ success: boolean }> => {
    return new Promise((resolve) => {
      socketRef.current?.emit('game:start', {}, resolve);
    });
  }, []);

  const updateConfig = useCallback((config: any) => {
    socketRef.current?.emit('player:update-config', config);
  }, []);

  const craftPotion = useCallback((elements: string[]): Promise<{ success: boolean; potion?: any; error?: string }> => {
    return new Promise((resolve) => {
      socketRef.current?.emit('player:craft-potion', { elements }, resolve);
    });
  }, []);

  const setReady = useCallback((ready: boolean) => {
    socketRef.current?.emit('player:ready', { ready });
  }, []);

  const runRace = useCallback((): Promise<{ success: boolean; result?: any }> => {
    return new Promise((resolve) => {
      socketRef.current?.emit('race:run', {}, resolve);
    });
  }, []);

  const finishRace = useCallback((platformTime: number): Promise<{ success: boolean }> => {
    return new Promise((resolve) => {
      socketRef.current?.emit('race:finish', { platformTime }, resolve);
    });
  }, []);

  const sendPosition = useCallback((data: { x: number; y: number; state: string; facing: number }) => {
    socketRef.current?.emit('race:position', data);
  }, []);

  const advance = useCallback(() => {
    socketRef.current?.emit('game:advance');
  }, []);

  return {
    connected,
    playerId,
    roomState,
    raceResult,
    createRoom,
    joinRoom,
    startGame,
    updateConfig,
    craftPotion,
    setReady,
    runRace,
    finishRace,
    sendPosition,
    otherPlayers,
    advance,
    setRaceResult,
  };
}
