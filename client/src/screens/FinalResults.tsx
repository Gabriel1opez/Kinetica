import { useEffect, useRef } from 'react';

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

const RANK_COLORS = ['#ffd700', '#cccccc', '#cd853f'];
const RANK_LABELS = ['1ST', '2ND', '3RD'];

interface Props {
  socket: any;
  onBackToMenu: () => void;
}

export default function FinalResults({ socket, onBackToMenu }: Props) {
  const room = socket.roomState;
  if (!room) return null;

  const me = room.players.find((p: any) => p.id === socket.playerId);
  const sorted = [...room.players].sort((a: any, b: any) => a.totalTime - b.totalTime);

  const allFeedback = me?.raceResults?.flatMap((r: any) =>
    r.feedback.map((fb: string) => ({ planet: r.planet, text: fb }))
  ) || [];

  // Animated trophy canvas
  const trophyRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = trophyRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;
    let raf = 0, t = 0;

    const draw = () => {
      t += 0.03;
      ctx.clearRect(0, 0, W, H);

      // Pulsing glow
      const glow = ctx.createRadialGradient(W/2, H/2, 5, W/2, H/2, 60);
      glow.addColorStop(0, `rgba(255,215,0,${0.15 + Math.sin(t) * 0.08})`);
      glow.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Trophy body (pixel art)
      const ox = W/2, oy = H/2 - 8 + Math.sin(t) * 6;
      ctx.save();
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur  = 16 + Math.sin(t) * 8;
      ctx.fillStyle   = '#ffd700';

      // Cup body
      ctx.beginPath();
      ctx.moveTo(ox - 22, oy - 26);
      ctx.lineTo(ox + 22, oy - 26);
      ctx.lineTo(ox + 18, oy + 4);
      ctx.lineTo(ox + 10, oy + 10);
      ctx.lineTo(ox + 10, oy + 16);
      ctx.lineTo(ox + 18, oy + 16);
      ctx.lineTo(ox + 18, oy + 22);
      ctx.lineTo(ox - 18, oy + 22);
      ctx.lineTo(ox - 18, oy + 16);
      ctx.lineTo(ox - 10, oy + 16);
      ctx.lineTo(ox - 10, oy + 10);
      ctx.lineTo(ox - 18, oy + 4);
      ctx.closePath();
      ctx.fill();

      // Star on cup
      ctx.fillStyle = '#cc9900';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
        const r = i % 2 === 0 ? 10 : 5;
        if (i === 0) ctx.moveTo(ox + Math.cos(angle) * r, oy - 12 + Math.sin(angle) * r);
        else ctx.lineTo(ox + Math.cos(angle) * r, oy - 12 + Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();

      // Particle sparks
      for (let i = 0; i < 6; i++) {
        const angle = t * 0.8 + i * (Math.PI * 2 / 6);
        const radius = 36 + Math.sin(t * 2 + i) * 8;
        const px = ox + Math.cos(angle) * radius;
        const py = oy + Math.sin(angle) * radius * 0.5 - 8;
        ctx.globalAlpha = 0.5 + Math.sin(t + i) * 0.4;
        ctx.fillStyle = i % 2 === 0 ? '#ffd700' : '#ff3366';
        ctx.fillRect(px - 2, py - 2, 4, 4);
      }
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto animate-fade-in">
      {/* Trophy header */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <canvas ref={trophyRef} width={140} height={120}
            className="block" style={{ imageRendering: 'auto' }} />
        </div>
        <h2 className="font-pixel text-2xl text-retro-yellow glow-text-gold animate-neon-flicker">
          RACE COMPLETE
        </h2>
        <p className="font-pixel text-[8px] text-retro-cyan mt-1 tracking-widest">
          FINAL STANDINGS ACROSS ALL PLANETS
        </p>
      </div>

      {/* Final leaderboard */}
      <div className="pixel-card mb-8">
        <p className="section-title text-center mb-4">FINAL RANKINGS</p>
        <div className="space-y-3">
          {sorted.map((player: any, i: number) => {
            const av      = AVATARS[player.avatar] || AVATARS[0];
            const isWinner = i === 0;
            const isMe    = player.id === socket.playerId;
            const rankCol = RANK_COLORS[i] || '#ffffff44';
            return (
              <div key={player.id}
                className="flex items-center gap-4 p-4 border transition-all"
                style={{
                  borderColor: isWinner ? '#ffd700' : isMe ? '#00d4ff' : '#1e1e5e',
                  background:  isWinner ? 'rgba(255,215,0,0.08)' : 'transparent',
                  boxShadow:   isWinner ? '0 0 20px rgba(255,215,0,0.15)' : isMe ? '0 0 12px rgba(0,212,255,0.1)' : undefined,
                }}>
                {/* Rank badge */}
                <div className="w-12 h-12 flex items-center justify-center border font-pixel text-[7px] flex-shrink-0"
                  style={{ borderColor: rankCol, color: rankCol, background: `${rankCol}18`,
                           boxShadow: i < 3 ? `0 0 10px ${rankCol}44` : undefined }}>
                  {RANK_LABELS[i] || `#${i+1}`}
                </div>
                {/* Avatar */}
                <div className="w-10 h-10 flex items-center justify-center border font-pixel text-[7px] flex-shrink-0"
                  style={{ borderColor: av.color, color: av.color, background: `${av.color}18` }}>
                  {av.label}
                </div>
                {/* Name + per-planet */}
                <div className="flex-1 min-w-0">
                  <p className="font-pixel text-[10px] text-retro-white">
                    {player.name}{isMe ? ' [YOU]' : ''}
                  </p>
                  <div className="flex gap-3 mt-1 flex-wrap">
                    {player.raceResults?.map((r: any, j: number) => {
                      const pd = PLANET_DISPLAY[r.planet] || { label: r.planet, color: '#ffffff' };
                      return (
                        <span key={j} className="font-pixel text-[5px]" style={{ color: pd.color + 'aa' }}>
                          {pd.label}: {r.totalTime.toFixed(1)}s
                        </span>
                      );
                    })}
                  </div>
                </div>
                {/* Total */}
                <div className="text-right flex-shrink-0">
                  <p className="font-pixel text-xl glow-text-gold text-retro-yellow">
                    {player.totalTime.toFixed(2)}s
                  </p>
                  <p className="font-pixel text-[5px] text-retro-white/30">TOTAL</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Science review */}
      {allFeedback.length > 0 && (
        <div className="pixel-card mb-8">
          <p className="section-title mb-1">COMPLETE SCIENCE REVIEW</p>
          <p className="section-subtitle">How real science impacted your race</p>

          {(['earth', 'mars', 'mercury'] as const).map(pk => {
            const pf = allFeedback.filter((f: any) => f.planet === pk);
            if (!pf.length) return null;
            const pd = PLANET_DISPLAY[pk];
            return (
              <div key={pk} className="mb-4">
                <p className="font-pixel text-[8px] mb-2" style={{ color: pd.color }}>{pd.label}</p>
                <div className="space-y-1">
                  {pf.map((f: any, i: number) => (
                    <div key={i} className="p-2 border border-retro-border bg-black/20 flex gap-2">
                      <span className="font-pixel text-[6px] text-retro-cyan flex-shrink-0">&gt;</span>
                      <p className="font-pixel text-[5px] text-retro-white/70 leading-relaxed">{f.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Science concepts */}
          <div className="mt-4 p-3 border border-retro-border/50 bg-retro-cyan/5">
            <p className="font-pixel text-[7px] text-retro-cyan mb-3">KEY CONCEPTS APPLIED</p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  label: 'SPORTS MEDICINE',
                  color: '#ff3366',
                  items: ['Muscle group specialization', 'ATP-PC / Anaerobic / Aerobic', 'Fatigue & altitude oxygen', 'Sliding filament theory'],
                },
                {
                  label: 'PHYSICS',
                  color: '#ffd700',
                  items: ['R = v²·sin(2θ)/g', 'Gravity varies by planet', 'F = ma', 'Optimal angle = 45°'],
                },
                {
                  label: 'CHEMISTRY',
                  color: '#39ff14',
                  items: ['Aerobic respiration', 'Na⁺/K⁺ pump', 'Hemoglobin & O₂', 'pH buffering & lactic acid'],
                },
              ].map(s => (
                <div key={s.label}>
                  <p className="font-pixel text-[6px] mb-2" style={{ color: s.color }}>{s.label}</p>
                  {s.items.map((item, i) => (
                    <p key={i} className="font-pixel text-[5px] text-retro-white/50 mb-1">- {item}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="text-center">
        <button onClick={onBackToMenu} className="btn-pink px-10 py-3 text-sm">
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
}
