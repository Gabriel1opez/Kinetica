import { useState, useRef, useEffect, useCallback } from 'react';

const PLANET_DATA: Record<string, { gravity: number; color: string; label: string }> = {
  earth:   { gravity: 9.8, color: '#00d4ff', label: 'EARTH' },
  mars:    { gravity: 3.7, color: '#ff6b35', label: 'MARS'  },
  mercury: { gravity: 3.7, color: '#aaaacc', label: 'MERCURY' },
};

interface Props { socket: any; }

export default function CatapultLaunch({ socket }: Props) {
  const room   = socket.roomState;
  const me     = room?.players.find((p: any) => p.id === socket.playerId);
  const planet = PLANET_DATA[room?.currentPlanet || 'earth'];

  const [angle, setAngle] = useState(45);
  const [force, setForce] = useState(50);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const calcTrajectory = useCallback(() => {
    const g      = planet?.gravity || 9.8;
    const mass   = me?.config?.mass || 70;
    const v0     = 5 + (force / 100) * 25;
    const mf     = 70 / mass;
    const rad    = (angle * Math.PI) / 180;
    const vx     = v0 * Math.cos(rad) * mf;
    const vy     = v0 * Math.sin(rad) * mf;
    const tFly   = (2 * vy) / g;
    const dist   = vx * tFly;
    const height = (vy * vy) / (2 * g);
    return { vx, vy, tFly, dist, height, g };
  }, [angle, force, planet, me]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx  = canvas.getContext('2d')!;
    const W    = canvas.width;
    const H    = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#050514');
    bg.addColorStop(1, '#0a0a28');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(0,212,255,0.05)';
    ctx.lineWidth   = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const groundY = H - 45;

    // Ground line
    ctx.save();
    ctx.shadowColor = planet.color;
    ctx.shadowBlur  = 8;
    ctx.strokeStyle = planet.color;
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();
    ctx.restore();

    // Catapult structure
    const startX = 70;
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(startX - 14, groundY - 34, 28, 34);
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(startX - 22, groundY - 12, 44, 12);
    // Arm
    const armRad = (angle * Math.PI) / 180;
    ctx.save();
    ctx.strokeStyle = '#ff6b35';
    ctx.shadowColor = '#ff6b35';
    ctx.shadowBlur  = 6;
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.moveTo(startX, groundY - 34);
    ctx.lineTo(startX + Math.cos(armRad) * 44, groundY - 34 - Math.sin(armRad) * 44);
    ctx.stroke();
    // Projectile on arm tip
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur  = 10;
    ctx.beginPath();
    ctx.arc(startX + Math.cos(armRad) * 44, groundY - 34 - Math.sin(armRad) * 44, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Trajectory arc
    const traj  = calcTrajectory();
    const scaleX = (W - 120) / Math.max(traj.dist, 1);
    const scaleY = (H - 80)  / Math.max(traj.height * 1.4, 1);
    const scale  = Math.min(scaleX, scaleY);

    ctx.save();
    ctx.strokeStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur  = 5;
    ctx.lineWidth   = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * traj.tFly;
      const x = startX + traj.vx * t * scale;
      const y = groundY - (traj.vy * t - 0.5 * traj.g * t * t) * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, Math.min(y, groundY));
      if (y >= groundY && i > 0) break;
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Landing spot
    const landX = Math.min(startX + traj.dist * scale, W - 24);
    ctx.save();
    ctx.fillStyle   = '#ff3366';
    ctx.shadowColor = '#ff3366';
    ctx.shadowBlur  = 12;
    ctx.beginPath();
    ctx.arc(landX, groundY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Distance label
    ctx.save();
    ctx.fillStyle   = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur  = 6;
    ctx.font        = '9px "Press Start 2P"';
    ctx.textAlign   = 'center';
    ctx.fillText(`${traj.dist.toFixed(1)}m`, Math.min(landX, W - 50), groundY + 26);
    ctx.restore();

    // Angle arc indicator
    ctx.save();
    ctx.strokeStyle = planet.color + 'aa';
    ctx.lineWidth   = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.arc(startX, groundY - 34, 28, -Math.PI, -(Math.PI) + (angle * Math.PI / 180));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = planet.color;
    ctx.font      = '7px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText(`${angle}°`, startX + 32, groundY - 42);
    ctx.restore();

  }, [angle, force, calcTrajectory, planet]);

  const handleReady = () => {
    socket.updateConfig({ catapult: { angle, force } });
    socket.setReady(true);
  };

  const traj   = calcTrajectory();
  const isReady = me?.isReady;

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto animate-fade-in">
      <div className="text-center mb-5">
        <h2 className="font-pixel text-lg text-retro-yellow glow-text-gold mb-1">CATAPULT LAUNCH</h2>
        <p className="font-pixel text-[7px] text-retro-cyan/60 mb-1 tracking-widest">PHYSICS — PROJECTILE MOTION</p>
        <p className="font-pixel text-[9px]" style={{ color: planet.color }}>
          {planet.label} &mdash; <span className="text-retro-white/50">g = {planet.gravity} m/s²</span>
        </p>
      </div>

      {/* Canvas */}
      <div className="pixel-card mb-5 p-1">
        <canvas ref={canvasRef} width={700} height={280} className="w-full"
          style={{ imageRendering: 'auto' }} />
      </div>

      {/* Controls */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="pixel-card">
          <p className="section-title">LAUNCH ANGLE (θ)</p>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-pixel text-[7px] text-retro-white/40">5°</span>
            <input type="range" min={5} max={85} value={angle}
              onChange={e => setAngle(parseInt(e.target.value))}
              style={{ '--thumb-color': planet.color } as React.CSSProperties}
              className="flex-1" />
            <span className="font-pixel text-[7px] text-retro-white/40">85°</span>
          </div>
          <p className="font-pixel text-xl text-center mt-1 glow-text" style={{ color: planet.color }}>{angle}°</p>
          <p className="font-pixel text-[5px] text-retro-white/30 text-center mt-1">
            OPTIMAL AT 45° WHERE sin(2θ) = 1
          </p>
          {/* Visual angle quality indicator */}
          <div className="mt-2 stat-bar h-2">
            <div className="stat-bar-fill transition-all duration-200"
              style={{
                width: `${(1 - Math.abs(angle - 45) / 40) * 100}%`,
                background: Math.abs(angle - 45) < 10 ? '#39ff14' : '#ffd700',
              }} />
          </div>
          <p className="font-pixel text-[5px] text-center mt-1 text-retro-white/30">ANGLE EFFICIENCY</p>
        </div>

        <div className="pixel-card">
          <p className="section-title">LAUNCH FORCE</p>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-pixel text-[7px] text-retro-white/40">MIN</span>
            <input type="range" min={10} max={100} value={force}
              onChange={e => setForce(parseInt(e.target.value))}
              style={{ '--thumb-color': '#ff6b35' } as React.CSSProperties}
              className="flex-1" />
            <span className="font-pixel text-[7px] text-retro-white/40">MAX</span>
          </div>
          <p className="font-pixel text-xl text-retro-orange glow-text text-center mt-1">{force}%</p>
          <p className="font-pixel text-[5px] text-retro-white/30 text-center mt-1">
            v₀ = {(5 + (force / 100) * 25).toFixed(1)} m/s
          </p>
          <div className="mt-2 stat-bar h-2">
            <div className="stat-bar-fill transition-all duration-200"
              style={{ width: `${force}%`, background: '#ff6b35' }} />
          </div>
          <p className="font-pixel text-[5px] text-center mt-1 text-retro-white/30">POWER OUTPUT</p>
        </div>
      </div>

      {/* Stats */}
      <div className="pixel-card mb-6">
        <p className="section-title mb-3">PROJECTED RESULTS</p>
        <div className="grid grid-cols-4 gap-4 text-center">
          {[
            { label: 'DISTANCE',   value: traj.dist.toFixed(1) + 'm',  color: '#ffd700' },
            { label: 'MAX HEIGHT', value: traj.height.toFixed(1) + 'm', color: '#39ff14' },
            { label: 'AIR TIME',   value: traj.tFly.toFixed(2) + 's',  color: '#00d4ff' },
            { label: 'HEAD START', value: (traj.dist * 0.15).toFixed(2) + 's', color: '#ff3366' },
          ].map(s => (
            <div key={s.label}>
              <p className="font-pixel text-[5px] text-retro-white/40 mb-1">{s.label}</p>
              <p className="font-pixel text-sm glow-text" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
        <p className="font-pixel text-[5px] text-retro-white/20 text-center mt-3">
          R = v₀²·sin(2θ)/g &nbsp;|&nbsp; H = v₀²·sin²(θ)/2g &nbsp;|&nbsp; T = 2·v₀·sin(θ)/g
        </p>
      </div>

      <div className="text-center">
        <button onClick={handleReady} disabled={!!isReady}
          className={isReady ? 'btn-ghost px-10 py-3' : 'btn-green px-10 py-3 text-sm'}>
          {isReady ? 'WAITING FOR OTHERS...' : 'LAUNCH!'}
        </button>
      </div>
    </div>
  );
}
