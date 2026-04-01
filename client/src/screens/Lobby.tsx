const AVATARS = [
  { label: 'RUN', color: '#ff3366' },
  { label: 'LFT', color: '#ffd700' },
  { label: 'ACR', color: '#39ff14' },
  { label: 'SWM', color: '#00d4ff' },
  { label: 'ZAP', color: '#ff6b35' },
  { label: 'SCI', color: '#cc88ff' },
  { label: 'ALC', color: '#e91e8c' },
  { label: 'RKT', color: '#00ffdd' },
];

interface Props { socket: any; }

export default function Lobby({ socket }: Props) {
  const room = socket.roomState;
  if (!room) return null;

  const me     = room.players.find((p: any) => p.id === socket.playerId);
  const isHost = me?.isHost;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 animate-fade-in">

      {/* Room code */}
      <div className="card-glow-cyan text-center mb-8 px-10 py-6">
        <p className="font-pixel text-[8px] text-retro-cyan/60 mb-2 tracking-widest">ROOM CODE</p>
        <p className="font-pixel text-4xl text-retro-yellow glow-text-gold tracking-[0.35em] animate-neon-flicker">
          {room.code}
        </p>
        <p className="font-pixel text-[7px] text-retro-white/30 mt-3">
          SHARE WITH FRIENDS TO JOIN
        </p>
      </div>

      {/* Players */}
      <div className="w-full max-w-lg mb-8">
        <p className="font-pixel text-[8px] text-retro-cyan text-center mb-3">
          PLAYERS — {room.players.length} / 8
        </p>
        <div className="grid grid-cols-2 gap-3">
          {room.players.map((player: any) => {
            const av  = AVATARS[player.avatar] || AVATARS[0];
            const isMe = player.id === socket.playerId;
            return (
              <div key={player.id}
                className="pixel-card flex items-center gap-3 transition-all"
                style={{ borderColor: isMe ? '#ffd700' : '#1e1e5e',
                         boxShadow: isMe ? '0 0 12px rgba(255,215,0,0.2)' : undefined }}>
                {/* Avatar */}
                <div className="w-9 h-9 flex items-center justify-center border font-pixel text-[7px] flex-shrink-0"
                  style={{ background: av.color + '22', borderColor: av.color, color: av.color,
                           boxShadow: `0 0 6px ${av.color}44` }}>
                  {av.label}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-pixel text-[9px] text-retro-white truncate">{player.name}</p>
                  <div className="flex gap-2 mt-0.5">
                    {player.isHost && (
                      <span className="font-pixel text-[6px] text-retro-yellow">HOST</span>
                    )}
                    {player.isReady && (
                      <span className="font-pixel text-[6px] text-retro-green">READY</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 4 - room.players.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="pixel-card flex items-center gap-3 opacity-20">
              <div className="w-9 h-9 border border-retro-border flex items-center justify-center
                font-pixel text-[7px] text-retro-white/30">
                ?
              </div>
              <p className="font-pixel text-[8px] text-retro-white/30">WAITING...</p>
            </div>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="pixel-card max-w-lg mb-8 text-center">
        <p className="font-pixel text-[7px] text-retro-white/60 leading-relaxed">
          CONFIGURE YOUR ATHLETE USING REAL SCIENCE &mdash; MUSCLE TRAINING,
          CHEMISTRY POTIONS, AND PROJECTILE PHYSICS &mdash; THEN RACE ACROSS
          EARTH, MARS, AND MERCURY.
        </p>
      </div>

      {/* Action */}
      {isHost ? (
        <button onClick={() => socket.startGame()} className="btn-green text-sm px-10 py-4">
          START GAME
        </button>
      ) : (
        <p className="font-pixel text-[9px] text-retro-white/40 animate-blink">
          WAITING FOR HOST TO START...
        </p>
      )}
    </div>
  );
}
