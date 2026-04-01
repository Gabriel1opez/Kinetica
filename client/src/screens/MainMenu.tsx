import { useState, useEffect, useRef } from 'react';

const AVATARS = [
  { label: 'P1', color: '#ff3366', bg: 'rgba(255,51,102,0.15)' },
  { label: 'P2', color: '#ffd700', bg: 'rgba(255,215,0,0.15)' },
  { label: 'P3', color: '#39ff14', bg: 'rgba(57,255,20,0.15)' },
  { label: 'P4', color: '#00d4ff', bg: 'rgba(0,212,255,0.15)' },
  { label: 'P5', color: '#ff6b35', bg: 'rgba(255,107,53,0.15)' },
  { label: 'P6', color: '#cc88ff', bg: 'rgba(204,136,255,0.15)' },
  { label: 'P7', color: '#e91e8c', bg: 'rgba(233,30,140,0.15)' },
  { label: 'P8', color: '#00ffdd', bg: 'rgba(0,255,221,0.15)' },
];

interface Props {
  socket: any;
  onJoined: () => void;
}

export default function MainMenu({ socket, onJoined }: Props) {
  const [mode, setMode]       = useState<'home' | 'create' | 'join'>('home');
  const [name, setName]       = useState('');
  const [avatar, setAvatar]   = useState(0);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const heroRef = useRef<HTMLCanvasElement>(null);

  // Retrowave hero canvas
  useEffect(() => {
    const canvas = heroRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;
    let raf = 0, t = 0;

    const draw = () => {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);

      // Deep purple-black sky background
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0,   '#120824');
      sky.addColorStop(0.5, '#1e0d40');
      sky.addColorStop(1,   '#2a0a50');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Retrowave striped sun circle
      const cx = W / 2, cy = H * 0.52, r = H * 0.38;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      // Gradient fill inside circle
      const sunGrad = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
      sunGrad.addColorStop(0,    '#5b8cff');
      sunGrad.addColorStop(0.25, '#a855f7');
      sunGrad.addColorStop(0.45, '#e040fb');
      sunGrad.addColorStop(0.6,  '#ff6ec7');
      sunGrad.addColorStop(0.75, '#ff6b35');
      sunGrad.addColorStop(1,    '#ffd700');
      ctx.fillStyle = sunGrad;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

      // Horizontal stripes (retrowave effect) — lower half only
      ctx.fillStyle = '#1e0d40';
      const stripeStart = cy + r * 0.1;
      const stripeCount = 12;
      for (let i = 0; i < stripeCount; i++) {
        const progress = i / stripeCount;
        const y = stripeStart + (r * 0.9) * (progress ** 1.6);
        const thickness = Math.max(1, (r * 0.9 / stripeCount) * (1 - progress * 0.6));
        ctx.fillRect(cx - r, y, r * 2, thickness * 0.6);
      }
      ctx.restore();

      // Sun outer glow ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#e040fb44';
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.restore();

      // Horizon glow bar
      ctx.save();
      const hGlow = ctx.createLinearGradient(0, cy, 0, cy + 30);
      hGlow.addColorStop(0,   'rgba(224,64,251,0.5)');
      hGlow.addColorStop(0.5, 'rgba(255,107,53,0.3)');
      hGlow.addColorStop(1,   'rgba(255,215,0,0)');
      ctx.fillStyle = hGlow;
      ctx.fillRect(0, cy - 4, W, 34);
      ctx.restore();

      // Palm tree silhouettes (left)
      const drawPalm = (px: number, py: number, sc: number) => {
        ctx.save();
        ctx.fillStyle = '#1a0830';
        // Trunk
        for (let i = 0; i < 12 * sc; i++) {
          const tw = (2 + i * 0.15) * sc;
          ctx.fillRect(px - tw / 2, py - i * 5 * sc, tw, 5 * sc);
        }
        // Fronds
        const topY = py - 12 * 5 * sc;
        const fronds = [
          [-1.2, -0.8], [-0.4, -1.1], [0.5, -1.0], [1.3, -0.7],
          [-0.8, -0.5], [0.9, -0.4],
        ];
        for (const [fx, fy] of fronds) {
          const ex = px + fx * 28 * sc, ey = topY + fy * 18 * sc;
          ctx.beginPath();
          ctx.moveTo(px, topY);
          ctx.quadraticCurveTo(px + fx * 14 * sc, topY + fy * 9 * sc, ex, ey);
          ctx.lineWidth = 3 * sc;
          ctx.strokeStyle = '#1a0830';
          ctx.stroke();
        }
        ctx.restore();
      };

      drawPalm(W * 0.18, H * 0.88, 0.85);
      drawPalm(W * 0.78, H * 0.9,  0.75);
      drawPalm(W * 0.88, H * 0.86, 1.0);

      // Ground strip
      ctx.save();
      const groundGrad = ctx.createLinearGradient(0, H * 0.85, 0, H);
      groundGrad.addColorStop(0, '#1a0830');
      groundGrad.addColorStop(1, '#0d0420');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, H * 0.85, W, H * 0.15);
      // Ground glow line
      ctx.fillStyle = 'rgba(224,64,251,0.4)';
      ctx.fillRect(0, H * 0.85, W, 2);
      ctx.restore();

      // Scanlines overlay
      ctx.save();
      ctx.globalAlpha = 0.04;
      for (let y = 0; y < H; y += 4) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, y, W, 2);
      }
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) { setError('ENTER YOUR NAME'); return; }
    setLoading(true); setError('');
    const result = await socket.createRoom(name.trim(), avatar);
    setLoading(false);
    if (result.success) onJoined();
    else setError('FAILED TO CREATE ROOM');
  };

  const handleJoin = async () => {
    if (!name.trim())     { setError('ENTER YOUR NAME'); return; }
    if (!joinCode.trim()) { setError('ENTER ROOM CODE'); return; }
    setLoading(true); setError('');
    const result = await socket.joinRoom(joinCode.trim().toUpperCase(), name.trim(), avatar);
    setLoading(false);
    if (result.success) onJoined();
    else setError(result.error?.toUpperCase() || 'FAILED TO JOIN');
  };

  if (mode === 'home') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 relative">
        {/* Hero canvas */}
        <div className="w-full max-w-2xl mb-6 overflow-hidden border border-retro-border"
          style={{ boxShadow: '0 0 40px rgba(168,85,247,0.3)', borderColor: 'rgba(168,85,247,0.4)' }}>
          <canvas ref={heroRef} width={640} height={220} className="w-full" style={{ imageRendering: 'auto' }} />
        </div>

        {/* Title */}
        <h1 className="font-pixel text-4xl md:text-5xl text-retro-yellow glow-text-gold mb-1 text-center animate-glitch tracking-widest"
          style={{ textShadow: '0 0 20px rgba(255,215,0,0.5), 3px 3px 0 rgba(0,0,0,0.8)' }}>
          KINETICA
        </h1>
        <p className="font-pixel text-[10px] text-retro-purple mb-2 text-center tracking-[0.25em]">
          ENGINEERED TO WIN
        </p>
        <p className="font-retro text-lg text-retro-white/50 mb-6 text-center max-w-md leading-relaxed">
          MULTIPLAYER 8-BIT SCIENCE RACING GAME
        </p>

        {/* Learning outcomes */}
        <div className="w-full max-w-lg mb-8 grid grid-cols-3 gap-3">
          {[
            { icon: '🏃', label: 'SPORTS MED', desc: 'Muscle groups, energy systems & biomechanics determine your race stats' },
            { icon: '⚗️', label: 'CHEMISTRY', desc: 'Combine molecules to brew performance-enhancing potions' },
            { icon: '🌍', label: 'PHYSICS', desc: 'Gravity, momentum & Newton\'s laws vary across planets' },
          ].map(o => (
            <div key={o.label} className="pixel-card p-3 text-center"
              style={{ borderColor: 'rgba(168,85,247,0.3)' }}>
              <div className="text-2xl mb-1">{o.icon}</div>
              <p className="font-pixel text-[8px] text-retro-purple mb-1">{o.label}</p>
              <p className="font-retro text-[11px] text-retro-white/50 leading-tight">{o.desc}</p>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button onClick={() => setMode('create')} className="btn-pink text-sm py-4">
            CREATE GAME
          </button>
          <button onClick={() => setMode('join')} className="btn-cyan text-sm py-4">
            JOIN GAME
          </button>
        </div>

        {/* Connection */}
        <div className="mt-8 font-retro text-lg flex items-center gap-2">
          <span className={`inline-block w-2 h-2 ${socket.connected ? 'bg-retro-green' : 'bg-retro-red'}`}
            style={{ boxShadow: socket.connected ? '0 0 6px #39ff14' : '0 0 6px #ff073a' }} />
          <span className="text-retro-white/30">
            {socket.connected ? 'CONNECTED' : 'CONNECTING...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 animate-fade-in">
      <button onClick={() => { setMode('home'); setError(''); }}
        className="font-retro text-xl text-retro-cyan hover:text-retro-white transition-colors cursor-pointer mb-8">
        &lt; BACK
      </button>

      <h2 className="font-pixel text-lg text-retro-yellow glow-text-gold mb-6">
        {mode === 'create' ? 'CREATE GAME' : 'JOIN GAME'}
      </h2>

      <div className="pixel-card w-full max-w-md space-y-5">
        {/* Name */}
        <div>
          <label className="font-retro text-lg text-retro-cyan block mb-2">PLAYER NAME</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={16}
            placeholder="ENTER NAME..."
            className="pixel-input"
            autoFocus
          />
        </div>

        {/* Avatar */}
        <div>
          <label className="font-retro text-lg text-retro-cyan block mb-2">
            CHOOSE COLOR
          </label>
          <div className="grid grid-cols-4 gap-2">
            {AVATARS.map((av, i) => (
              <button key={i} onClick={() => setAvatar(i)}
                className="avatar-badge transition-all"
                style={{
                  background: avatar === i ? av.bg : 'rgba(0,0,0,0.3)',
                  borderColor: avatar === i ? av.color : '#1e1e5e',
                  color: av.color,
                  boxShadow: avatar === i ? `0 0 10px ${av.color}66` : 'none',
                  transform: avatar === i ? 'scale(1.08)' : 'scale(1)',
                }}>
                {av.label}
              </button>
            ))}
          </div>
        </div>

        {/* Join code */}
        {mode === 'join' && (
          <div>
            <label className="font-retro text-lg text-retro-cyan block mb-2">ROOM CODE</label>
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="XXXXXX"
              className="pixel-input text-center tracking-[0.6em] text-lg uppercase"
            />
          </div>
        )}

        {error && (
          <p className="font-retro text-xl text-retro-red text-center animate-shake">{error}</p>
        )}

        <button
          onClick={mode === 'create' ? handleCreate : handleJoin}
          disabled={loading}
          className="btn-green w-full py-3 text-sm"
        >
          {loading ? 'CONNECTING...' : mode === 'create' ? 'CREATE ROOM' : 'JOIN ROOM'}
        </button>
      </div>
    </div>
  );
}
