import React, { useState, useRef, useEffect, useCallback } from 'react';

const PLANET_DATA: Record<string, { gravity: number; color: string; emoji: string; name: string }> = {
  earth: { gravity: 9.8, color: '#39ff14', emoji: '🌍', name: 'Earth' },
  mars: { gravity: 3.7, color: '#ff6b35', emoji: '🔴', name: 'Mars' },
  mercury: { gravity: 3.7, color: '#808080', emoji: '⚫', name: 'Mercury' },
};

interface Props {
  socket: any;
}

export default function CatapultLaunch({ socket }: Props) {
  const room = socket.roomState;
  const me = room?.players.find((p: any) => p.id === socket.playerId);
  const planet = PLANET_DATA[room?.currentPlanet || 'earth'];

  const [angle, setAngle] = useState(45);
  const [force, setForce] = useState(50);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate trajectory for preview
  const calcTrajectory = useCallback(() => {
    const g = planet?.gravity || 9.8;
    const mass = me?.config?.mass || 70;
    const angleRad = (angle * Math.PI) / 180;
    const v0 = 5 + (force / 100) * 25;
    const massFactor = 70 / mass;
    const vx = v0 * Math.cos(angleRad) * massFactor;
    const vy = v0 * Math.sin(angleRad) * massFactor;
    const totalTime = (2 * vy) / g;
    const maxDist = vx * totalTime;
    const maxHeight = (vy * vy) / (2 * g);

    return { vx, vy, totalTime, maxDist, maxHeight, g };
  }, [angle, force, planet, me]);

  // Draw trajectory on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Ground
    ctx.fillStyle = '#2d1b4e';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Ground line
    const groundY = h - 40;
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();

    // Catapult
    const startX = 60;
    ctx.fillStyle = '#cd853f';
    ctx.fillRect(startX - 10, groundY - 30, 20, 30);
    ctx.fillRect(startX - 20, groundY - 10, 40, 10);

    // Trajectory arc
    const traj = calcTrajectory();
    const scaleX = (w - 100) / Math.max(traj.maxDist, 10);
    const scaleY = (h - 100) / Math.max(traj.maxHeight * 1.3, 5);
    const scale = Math.min(scaleX, scaleY);

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();

    const steps = 50;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * traj.totalTime;
      const x = startX + traj.vx * t * scale;
      const y = groundY - (traj.vy * t - 0.5 * traj.g * t * t) * scale;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, Math.min(y, groundY));

      if (y >= groundY && i > 0) break;
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Landing point
    const landX = startX + traj.maxDist * scale;
    ctx.fillStyle = '#ff073a';
    ctx.beginPath();
    ctx.arc(Math.min(landX, w - 20), groundY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Distance text
    ctx.fillStyle = '#ffd700';
    ctx.font = '12px "Press Start 2P"';
    ctx.fillText(`${traj.maxDist.toFixed(1)}m`, Math.min(landX, w - 80), groundY + 25);

    // Angle indicator
    const angleRad = (angle * Math.PI) / 180;
    const lineLen = 50;
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(startX, groundY - 30);
    ctx.lineTo(startX + Math.cos(angleRad) * lineLen, groundY - 30 - Math.sin(angleRad) * lineLen);
    ctx.stroke();

  }, [angle, force, calcTrajectory]);

  const handleReady = () => {
    socket.updateConfig({ catapult: { angle, force } });
    socket.setReady(true);
  };

  const traj = calcTrajectory();
  const isReady = me?.isReady;

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      <h2 className="font-pixel text-xl text-retro-yellow text-center mb-2">
        Catapult Launch
      </h2>
      <p className="font-pixel text-[8px] text-retro-cyan text-center mb-2">
        Physics — Projectile Motion
      </p>
      <p className="font-pixel text-[10px] text-center mb-6">
        <span style={{ color: planet?.color }}>{planet?.emoji} {planet?.name}</span>
        <span className="text-white/50"> — Gravity: {planet?.gravity} m/s²</span>
      </p>

      {/* Canvas */}
      <div className="pixel-card mb-6">
        <canvas
          ref={canvasRef}
          width={700}
          height={300}
          className="w-full border border-white/10"
          style={{ imageRendering: 'auto' }}
        />
      </div>

      {/* Controls */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="pixel-card">
          <h3 className="font-pixel text-[10px] text-retro-pink mb-3">Launch Angle (θ)</h3>
          <div className="flex items-center gap-4">
            <span className="font-pixel text-[8px] text-white/50">0°</span>
            <input
              type="range"
              min={5}
              max={85}
              value={angle}
              onChange={e => setAngle(parseInt(e.target.value))}
              className="flex-1 h-3 appearance-none bg-black/50 border border-white/20 cursor-pointer"
              style={{ accentColor: '#00d4ff' }}
            />
            <span className="font-pixel text-[8px] text-white/50">90°</span>
          </div>
          <p className="font-pixel text-lg text-retro-cyan text-center mt-2">{angle}°</p>
          <p className="font-pixel text-[6px] text-white/40 text-center mt-1">
            Optimal range at 45° (sin(2θ) = 1)
          </p>
        </div>

        <div className="pixel-card">
          <h3 className="font-pixel text-[10px] text-retro-pink mb-3">Launch Force</h3>
          <div className="flex items-center gap-4">
            <span className="font-pixel text-[8px] text-white/50">Min</span>
            <input
              type="range"
              min={10}
              max={100}
              value={force}
              onChange={e => setForce(parseInt(e.target.value))}
              className="flex-1 h-3 appearance-none bg-black/50 border border-white/20 cursor-pointer"
              style={{ accentColor: '#ff6b35' }}
            />
            <span className="font-pixel text-[8px] text-white/50">Max</span>
          </div>
          <p className="font-pixel text-lg text-retro-orange text-center mt-2">{force}%</p>
          <p className="font-pixel text-[6px] text-white/40 text-center mt-1">
            v₀ = {(5 + (force / 100) * 25).toFixed(1)} m/s
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="pixel-card mb-8">
        <h3 className="font-pixel text-[10px] text-retro-cyan mb-3">Projected Results</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="font-pixel text-[6px] text-white/50">Distance</p>
            <p className="font-pixel text-sm text-retro-yellow">{traj.maxDist.toFixed(1)}m</p>
          </div>
          <div>
            <p className="font-pixel text-[6px] text-white/50">Max Height</p>
            <p className="font-pixel text-sm text-retro-green">{traj.maxHeight.toFixed(1)}m</p>
          </div>
          <div>
            <p className="font-pixel text-[6px] text-white/50">Air Time</p>
            <p className="font-pixel text-sm text-retro-cyan">{traj.totalTime.toFixed(2)}s</p>
          </div>
          <div>
            <p className="font-pixel text-[6px] text-white/50">Head Start</p>
            <p className="font-pixel text-sm text-retro-pink">{(traj.maxDist * 0.15).toFixed(2)}s</p>
          </div>
        </div>
        <p className="font-pixel text-[6px] text-white/30 text-center mt-3">
          R = v₀²·sin(2θ) / g | H = v₀²·sin²(θ) / 2g | T = 2·v₀·sin(θ) / g
        </p>
      </div>

      <div className="text-center">
        <button
          onClick={handleReady}
          disabled={isReady}
          className={`pixel-btn ${isReady ? 'bg-gray-600 text-gray-400' : 'bg-retro-green text-black'}`}
        >
          {isReady ? 'Waiting for others...' : 'Launch!'}
        </button>
      </div>
    </div>
  );
}
