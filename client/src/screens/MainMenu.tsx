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

  // Hero canvas animation
  useEffect(() => {
    const canvas = heroRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;
    let raf = 0, t = 0;

    const draw = () => {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);

      // Deep sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#020210');
      sky.addColorStop(1, '#0a0a28');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Grid floor (perspective)
      const horizon = H * 0.55;
      ctx.save();
      ctx.strokeStyle = 'rgba(0,212,255,0.18)';
      ctx.lineWidth = 1;
      // Horizontal lines
      for (let i = 0; i <= 8; i++) {
        const y = horizon + (H - horizon) * (i / 8) ** 1.5;
        ctx.globalAlpha = 0.1 + 0.5 * (i / 8);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      // Vertical lines (converge to vanishing point)
      ctx.globalAlpha = 1;
      const vp = W / 2;
      for (let i = -8; i <= 8; i++) {
        const xBot = vp + i * (W / 10);
        ctx.globalAlpha = 0.08 + 0.04 * Math.abs(i);
        ctx.beginPath();
        ctx.moveTo(vp + i * 12, horizon);
        ctx.lineTo(xBot, H);
        ctx.stroke();
      }
      ctx.restore();

      // Scrolling neon city silhouette
      ctx.save();
      ctx.globalAlpha = 0.55;
      const bldgColors = ['#0d0d3a', '#0a0a30'];
      const bldgs = [
        [0,60,80,90],[90,40,60,110],[160,70,50,100],[220,35,70,120],
        [300,55,65,95],[375,45,55,115],[440,65,75,105],[520,30,55,125],
        [580,60,70,100],[660,50,60,110],[730,40,75,90],[790,65,55,95],
        [860,35,60,120],[930,55,70,100],[1010,45,55,115],
      ];
      const scrollX = (t * 18) % 320;
      for (let rep = -1; rep <= 2; rep++) {
        for (const [bx, bh, bw] of bldgs) {
          const x = (bx as number) - scrollX + rep * 320;
          if (x > W + 100 || x + (bw as number) < -10) continue;
          ctx.fillStyle = bldgColors[(bx as number) % 2];
          ctx.fillRect(x, horizon - (bh as number), bw as number, bh as number);
          // window lights
          for (let wy = horizon - (bh as number) + 6; wy < horizon - 4; wy += 10) {
            for (let wx = x + 4; wx < x + (bw as number) - 4; wx += 8) {
              if ((wx + wy + Math.floor(t * 0.4)) % 3 !== 0) {
                ctx.fillStyle = Math.random() > 0.95 ? '#ffd70066' : '#00d4ff22';
                ctx.fillRect(wx, wy, 4, 5);
              }
            }
          }
        }
      }
      ctx.restore();

      // Neon horizon glow
      ctx.save();
      const grd = ctx.createLinearGradient(0, horizon - 30, 0, horizon + 20);
      grd.addColorStop(0, 'rgba(255,51,102,0)');
      grd.addColorStop(0.5, 'rgba(255,51,102,0.35)');
      grd.addColorStop(1, 'rgba(255,51,102,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, horizon - 30, W, 50);
      ctx.restore();

      // Floating particles
      ctx.save();
      for (let i = 0; i < 12; i++) {
        const px = (i * 137 + t * 15) % W;
        const py = horizon - 60 - (Math.sin(t * 0.6 + i) * 0.5 + 0.5) * 80;
        ctx.globalAlpha = 0.4 + Math.sin(t + i) * 0.3;
        ctx.fillStyle = i % 2 === 0 ? '#00d4ff' : '#ff3366';
        ctx.fillRect(px, py, 2, 2);
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
          style={{ boxShadow: '0 0 40px rgba(255,51,102,0.15)' }}>
          <canvas ref={heroRef} width={640} height={200} className="w-full" style={{ imageRendering: 'auto' }} />
        </div>

        {/* Title */}
        <h1 className="font-pixel text-4xl md:text-5xl text-retro-yellow glow-text-gold mb-1 text-center animate-glitch tracking-widest">
          KINETICA
        </h1>
        <p className="font-pixel text-[10px] text-retro-cyan mb-2 text-center tracking-[0.25em]">
          ENGINEERED TO WIN
        </p>
        <p className="font-retro text-lg text-retro-white/40 mb-10 text-center max-w-md leading-relaxed">
          AN 8-BIT MULTIPLAYER SCIENCE RACING GAME<br/>
          SPORTS MEDICINE &bull; CHEMISTRY &bull; PHYSICS
        </p>

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
        <div className="mt-10 font-retro text-lg flex items-center gap-2">
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
