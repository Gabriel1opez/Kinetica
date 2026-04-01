import React from 'react';

const AVATARS = ['🏃', '🏋️', '🤸', '🏊', '⚡', '🔬', '🧪', '🚀'];

interface Props {
  socket: any;
}

export default function Lobby({ socket }: Props) {
  const room = socket.roomState;
  if (!room) return null;

  const me = room.players.find((p: any) => p.id === socket.playerId);
  const isHost = me?.isHost;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Room Code Display */}
      <div className="pixel-card text-center mb-8">
        <p className="font-pixel text-[10px] text-retro-cyan mb-2">ROOM CODE</p>
        <p className="font-pixel text-4xl text-retro-yellow glow-text tracking-[0.3em]">
          {room.code}
        </p>
        <p className="font-pixel text-[8px] text-white/50 mt-2">
          Share this code with other players to join!
        </p>
      </div>

      {/* Players List */}
      <div className="w-full max-w-lg mb-8">
        <h3 className="font-pixel text-xs text-retro-cyan mb-4 text-center">
          Players ({room.players.length}/8)
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {room.players.map((player: any) => (
            <div
              key={player.id}
              className={`pixel-card flex items-center gap-3 ${
                player.id === socket.playerId ? 'border-retro-yellow' : ''
              }`}
            >
              <span className="text-2xl">{AVATARS[player.avatar] || '🏃'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-pixel text-[10px] text-white truncate">{player.name}</p>
                {player.isHost && (
                  <span className="font-pixel text-[8px] text-retro-yellow">HOST</span>
                )}
              </div>
              {player.isReady && (
                <span className="font-pixel text-[8px] text-retro-green">READY</span>
              )}
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 4 - room.players.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="pixel-card opacity-30 flex items-center gap-3">
              <span className="text-2xl">❓</span>
              <p className="font-pixel text-[10px] text-white/50">Waiting...</p>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="pixel-card max-w-lg mb-8 text-center">
        <p className="font-pixel text-[8px] text-white/70 leading-relaxed">
          Welcome to Kinetica! You'll configure your runner using real science —
          muscle training (Sports Medicine), potion crafting (Chemistry),
          and catapult launching (Physics) — then race across Earth, Mars, and Mercury!
        </p>
      </div>

      {/* Start button (host only) */}
      {isHost ? (
        <button
          onClick={() => socket.startGame()}
          className="pixel-btn bg-retro-green text-black"
        >
          Start Game
        </button>
      ) : (
        <p className="font-pixel text-[10px] text-white/50 animate-pulse">
          Waiting for host to start...
        </p>
      )}
    </div>
  );
}
