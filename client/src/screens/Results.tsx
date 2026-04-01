const AVATARS = [
  { label: 'RUN', color: '#ff3366' }, { label: 'LFT', color: '#ffd700' },
  { label: 'ACR', color: '#39ff14' }, { label: 'SWM', color: '#00d4ff' },
  { label: 'ZAP', color: '#ff6b35' }, { label: 'SCI', color: '#cc88ff' },
  { label: 'ALC', color: '#e91e8c' }, { label: 'RKT', color: '#00ffdd' },
];

const PLANET_DISPLAY: Record<string, { label: string; color: string }> = {
  earth:   { label: 'EARTH',   color: '#00d4ff' },
  mars:    { label: 'MARS',    color: '#ff6b35' },
  mercury: { label: 'MERCURY', color: '#aaaacc' },
};

const RANK_COLORS = ['#ffd700', '#aaaacc', '#cd853f'];
const RANK_LABELS = ['1ST', '2ND', '3RD'];

interface Props { socket: any; }

export default function Results({ socket }: Props) {
  const room = socket.roomState;
  if (!room) return null;

  const me     = room.players.find((p: any) => p.id === socket.playerId);
  const isHost = me?.isHost;
  const planet = PLANET_DISPLAY[room.currentPlanet] || { label: 'UNKNOWN', color: '#ffffff' };

  const sorted = [...room.players].sort((a: any, b: any) => {
    const aT = a.raceResults?.[a.raceResults.length - 1]?.totalTime ?? Infinity;
    const bT = b.raceResults?.[b.raceResults.length - 1]?.totalTime ?? Infinity;
    return aT - bT;
  });

  const myResult = me?.raceResults?.[me.raceResults.length - 1];

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <p className="font-pixel text-[7px] text-retro-white/40 mb-1">RACE RESULTS</p>
        <h2 className="font-pixel text-xl glow-text mb-1" style={{ color: planet.color }}>
          {planet.label}
        </h2>
      </div>

      {/* Leaderboard */}
      <div className="pixel-card mb-6">
        <p className="section-title text-center mb-4">RACE RANKINGS</p>
        <div className="space-y-2">
          {sorted.map((player: any, i: number) => {
            const latest  = player.raceResults?.[player.raceResults.length - 1];
            const av      = AVATARS[player.avatar] || AVATARS[0];
            const isMe    = player.id === socket.playerId;
            const rankCol = RANK_COLORS[i] || '#ffffff44';
            return (
              <div key={player.id}
                className="flex items-center gap-3 p-3 border transition-all"
                style={{
                  borderColor: isMe ? '#ffd700' : i === 0 ? 'rgba(255,215,0,0.25)' : '#1e1e5e',
                  background:  i === 0 ? 'rgba(255,215,0,0.06)' : isMe ? 'rgba(255,215,0,0.04)' : 'transparent',
                  boxShadow:   isMe ? '0 0 12px rgba(255,215,0,0.15)' : undefined,
                }}>
                {/* Rank */}
                <div className="w-10 h-10 flex items-center justify-center border flex-shrink-0 font-pixel text-[8px]"
                  style={{ borderColor: rankCol, color: rankCol, background: `${rankCol}18` }}>
                  {RANK_LABELS[i] || `#${i+1}`}
                </div>
                {/* Avatar */}
                <div className="w-8 h-8 flex items-center justify-center border font-pixel text-[6px] flex-shrink-0"
                  style={{ borderColor: av.color, color: av.color, background: `${av.color}18` }}>
                  {av.label}
                </div>
                {/* Name + total */}
                <div className="flex-1 min-w-0">
                  <p className="font-pixel text-[9px] text-retro-white truncate">
                    {player.name}{isMe ? ' [YOU]' : ''}
                  </p>
                  <p className="font-pixel text-[6px] text-retro-white/40 mt-0.5">
                    CUMULATIVE: {player.totalTime.toFixed(2)}s
                  </p>
                </div>
                {/* Race time */}
                <div className="text-right">
                  <p className="font-pixel text-base glow-text-gold text-retro-yellow">
                    {latest?.totalTime?.toFixed(2) ?? '--'}s
                  </p>
                  <p className="font-pixel text-[5px] text-retro-white/30">THIS RACE</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Science feedback */}
      {myResult?.feedback?.length > 0 && (
        <div className="pixel-card mb-8">
          <p className="section-title mb-3">SCIENCE REVIEW</p>
          <p className="section-subtitle">Why you got that time</p>
          <div className="space-y-2">
            {myResult.feedback.map((fb: string, i: number) => (
              <div key={i} className="p-2 border border-retro-border bg-black/20 flex gap-2">
                <span className="font-pixel text-[8px] text-retro-cyan flex-shrink-0">&gt;</span>
                <p className="font-pixel text-[6px] text-retro-white/75 leading-relaxed">{fb}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        {isHost ? (
          <button onClick={() => socket.setReady(true)}
            className="btn-green px-10 py-3 text-sm">
            {room.currentPlanet === 'mercury' ? 'VIEW FINAL RESULTS' : 'NEXT PLANET'}
          </button>
        ) : (
          <button onClick={() => socket.setReady(true)} className="btn-cyan px-10 py-3 text-sm">
            READY
          </button>
        )}
      </div>
    </div>
  );
}
