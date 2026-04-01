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
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Catapult pivot position on canvas
  const CATAPULT_X = 90;
  const GROUND_Y = 260;
  const ARM_LENGTH = 52;

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
    return { v0: v0 * mf, vx, vy, tFly, dist, height, g, rad };
  }, [angle, force, planet, me]);

  // Convert canvas coords from mouse event
  const getCanvasCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? (e as any).changedTouches[0]?.clientX ?? 0;
      clientY = e.touches[0]?.clientY ?? (e as any).changedTouches[0]?.clientY ?? 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // Slingshot drag: compute angle and force from drag vector
  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCanvasCoords(e);
    // Check if click is near the runner/bucket area at the tip of the arm
    const armRad = (angle * Math.PI) / 180;
    const tipX = CATAPULT_X + Math.cos(armRad) * ARM_LENGTH;
    const tipY = GROUND_Y - 34 - Math.sin(armRad) * ARM_LENGTH;
    const dx = coords.x - tipX;
    const dy = coords.y - tipY;
    if (Math.sqrt(dx * dx + dy * dy) < 40) {
      setIsDragging(true);
      setDragStart(coords);
      setDragCurrent(coords);
    }
  }, [angle, getCanvasCoords]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    setDragCurrent(coords);

    if (dragStart) {
      // Drag backward (left) = more force, drag direction = angle
      const dx = dragStart.x - coords.x; // positive when dragging left
      const dy = dragStart.y - coords.y; // positive when dragging up

      // Force from distance (clamped)
      const dist = Math.sqrt(dx * dx + dy * dy);
      const newForce = Math.min(100, Math.max(10, (dist / 200) * 100));
      setForce(Math.round(newForce));

      // Angle from drag direction (relative to pull-back)
      if (dist > 5) {
        const dragAngle = Math.atan2(Math.abs(dy), Math.abs(dx)) * (180 / Math.PI);
        // Clamp angle between 5 and 85
        const clampedAngle = Math.min(85, Math.max(5, dragAngle));
        setAngle(Math.round(clampedAngle));
      }
    }
  }, [isDragging, dragStart, getCanvasCoords]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
  }, []);

  // Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx  = canvas.getContext('2d')!;
    const W    = canvas.width;
    const H    = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#050514');
    bg.addColorStop(0.6, '#0a0a28');
    bg.addColorStop(1, '#0f0f20');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(0,212,255,0.04)';
    ctx.lineWidth   = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const groundY = GROUND_Y;

    // =====================
    // GROUND with details
    // =====================
    // Ground fill
    ctx.fillStyle = '#1a1208';
    ctx.fillRect(0, groundY, W, H - groundY);

    // Ground surface line
    ctx.save();
    ctx.shadowColor = planet.color;
    ctx.shadowBlur  = 6;
    ctx.strokeStyle = planet.color;
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();
    ctx.restore();

    // Ground texture pixels
    ctx.fillStyle = '#2a1a08';
    for (let i = 0; i < 80; i++) {
      const gx = (i * 37 + 13) % W;
      const gy = groundY + 4 + ((i * 7) % 40);
      ctx.fillRect(gx, gy, 2, 2);
    }
    ctx.fillStyle = '#3a2a10';
    for (let i = 0; i < 40; i++) {
      const gx = (i * 53 + 7) % W;
      const gy = groundY + 2 + ((i * 11) % 30);
      ctx.fillRect(gx, gy, 3, 1);
    }

    // Distance markers every 10m on the ground
    const traj = calcTrajectory();
    const maxDrawDist = Math.max(traj.dist * 1.3, 60);
    const pixelsPerMeter = (W - 140) / maxDrawDist;

    ctx.font      = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    for (let m = 10; m <= maxDrawDist; m += 10) {
      const mx = CATAPULT_X + m * pixelsPerMeter;
      if (mx > W - 10) break;
      // Tick mark
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mx, groundY - 3);
      ctx.lineTo(mx, groundY + 6);
      ctx.stroke();
      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillText(`${m}m`, mx, groundY + 16);
    }

    // =====================
    // LANDING ZONES
    // =====================
    const optimalDist = traj.dist;
    const optimalX = CATAPULT_X + optimalDist * pixelsPerMeter;

    // Short zone (red, before optimal)
    if (optimalDist > 5) {
      const shortStart = CATAPULT_X + Math.max(0, (optimalDist - 8)) * pixelsPerMeter;
      const shortEnd = CATAPULT_X + Math.max(0, (optimalDist - 2)) * pixelsPerMeter;
      ctx.fillStyle = 'rgba(255,50,50,0.12)';
      ctx.fillRect(shortStart, groundY - 2, shortEnd - shortStart, 4);
      ctx.fillStyle = '#ff3333aa';
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('SHORT', (shortStart + shortEnd) / 2, groundY - 8);
    }

    // Optimal zone (green, around landing point)
    const optZoneStart = CATAPULT_X + Math.max(0, (optimalDist - 2)) * pixelsPerMeter;
    const optZoneEnd = CATAPULT_X + (optimalDist + 2) * pixelsPerMeter;
    ctx.fillStyle = 'rgba(57,255,20,0.15)';
    ctx.fillRect(optZoneStart, groundY - 2, Math.max(optZoneEnd - optZoneStart, 8), 4);
    ctx.fillStyle = '#39ff14cc';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    if (optimalX > 50 && optimalX < W - 50) {
      ctx.fillText('OPTIMAL', (optZoneStart + optZoneEnd) / 2, groundY - 8);
    }

    // Overshoot zone (orange, after optimal)
    const overStart = CATAPULT_X + (optimalDist + 2) * pixelsPerMeter;
    const overEnd = CATAPULT_X + (optimalDist + 10) * pixelsPerMeter;
    if (overStart < W - 20) {
      ctx.fillStyle = 'rgba(255,165,0,0.12)';
      ctx.fillRect(overStart, groundY - 2, Math.min(overEnd - overStart, W - overStart - 5), 4);
      ctx.fillStyle = '#ffaa33aa';
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      if ((overStart + overEnd) / 2 < W - 40) {
        ctx.fillText('OVER', Math.min((overStart + overEnd) / 2, W - 40), groundY - 8);
      }
    }

    // =====================
    // PIXEL-ART CATAPULT
    // =====================
    const cx = CATAPULT_X;
    const cy = groundY;

    // Helper to draw pixel blocks
    const px = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    };

    // Base/wheels
    px(cx - 28, cy - 6, 56, 6, '#3a2510');  // base plank
    px(cx - 26, cy - 4, 52, 4, '#4a3520');  // base highlight
    // Wheels
    px(cx - 24, cy - 2, 8, 8, '#2a1a0a');   // left wheel
    px(cx - 22, cy, 4, 4, '#555');           // left hub
    px(cx + 16, cy - 2, 8, 8, '#2a1a0a');   // right wheel
    px(cx + 18, cy, 4, 4, '#555');           // right hub

    // Vertical frame posts
    px(cx - 20, cy - 40, 6, 34, '#4a2a10');  // left post
    px(cx + 14, cy - 40, 6, 34, '#4a2a10');  // right post
    px(cx - 18, cy - 38, 2, 30, '#5a3a20');  // left post highlight
    px(cx + 16, cy - 38, 2, 30, '#5a3a20');  // right post highlight

    // Cross beam at top
    px(cx - 22, cy - 42, 44, 4, '#5a3a18');
    px(cx - 20, cy - 40, 40, 2, '#6a4a28');

    // Metal bands on posts
    px(cx - 22, cy - 32, 8, 2, '#8888aa');   // left band
    px(cx + 14, cy - 32, 8, 2, '#8888aa');   // right band
    px(cx - 22, cy - 18, 8, 2, '#8888aa');   // left band lower
    px(cx + 14, cy - 18, 8, 2, '#8888aa');   // right band lower

    // Metal bolts (small bright pixels)
    px(cx - 19, cy - 31, 2, 2, '#ccccee');
    px(cx + 17, cy - 31, 2, 2, '#ccccee');
    px(cx - 19, cy - 17, 2, 2, '#ccccee');
    px(cx + 17, cy - 17, 2, 2, '#ccccee');

    // Pivot point
    const pivotX = cx;
    const pivotY = cy - 34;
    px(pivotX - 3, pivotY - 3, 6, 6, '#8888aa'); // pivot metal piece
    px(pivotX - 2, pivotY - 2, 4, 4, '#aaaacc'); // pivot highlight

    // Rotating arm
    const armRad = (angle * Math.PI) / 180;
    const tipX = pivotX + Math.cos(armRad) * ARM_LENGTH;
    const tipY = pivotY - Math.sin(armRad) * ARM_LENGTH;
    const counterX = pivotX - Math.cos(armRad) * 18;
    const counterY = pivotY + Math.sin(armRad) * 18;

    ctx.save();
    // Arm beam
    ctx.strokeStyle = '#6a4a20';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(counterX, counterY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    // Arm highlight
    ctx.strokeStyle = '#8a6a30';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(counterX, counterY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    ctx.restore();

    // Counterweight
    ctx.fillStyle = '#555566';
    ctx.fillRect(counterX - 5, counterY - 3, 10, 8);
    ctx.fillStyle = '#666677';
    ctx.fillRect(counterX - 4, counterY - 2, 8, 6);

    // Bucket at tip
    ctx.fillStyle = '#5a3a18';
    ctx.beginPath();
    ctx.moveTo(tipX - 8, tipY - 2);
    ctx.lineTo(tipX - 6, tipY + 8);
    ctx.lineTo(tipX + 6, tipY + 8);
    ctx.lineTo(tipX + 8, tipY - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#6a4a28';
    ctx.fillRect(tipX - 7, tipY - 1, 14, 2);

    // Tension rope from pivot to arm (taut line)
    ctx.save();
    ctx.strokeStyle = '#aa8855';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    const ropeAnchorX = cx - 14;
    const ropeAnchorY = cy - 40;
    ctx.beginPath();
    ctx.moveTo(ropeAnchorX, ropeAnchorY);
    const ropeMidX = (ropeAnchorX + tipX) / 2;
    const ropeMidY = (ropeAnchorY + tipY) / 2 + 6;
    ctx.quadraticCurveTo(ropeMidX, ropeMidY, tipX, tipY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // =====================
    // RUNNER CHARACTER in bucket
    // =====================
    const runnerX = tipX;
    const runnerY = tipY - 4;

    // Body
    px(runnerX - 3, runnerY - 12, 6, 8, '#ff6b35'); // torso
    px(runnerX - 2, runnerY - 11, 4, 6, '#ff8855'); // torso highlight
    // Head
    px(runnerX - 3, runnerY - 18, 6, 6, '#ffcc88'); // head
    px(runnerX - 2, runnerY - 17, 4, 4, '#ffddaa'); // face
    // Eyes
    px(runnerX - 2, runnerY - 16, 2, 2, '#222');
    px(runnerX + 1, runnerY - 16, 2, 2, '#222');
    // Helmet
    px(runnerX - 4, runnerY - 19, 8, 2, '#3366ff');
    px(runnerX - 3, runnerY - 20, 6, 2, '#3366ff');
    // Arms up (excited!)
    px(runnerX - 5, runnerY - 14, 2, 4, '#ffcc88');
    px(runnerX + 4, runnerY - 14, 2, 4, '#ffcc88');

    // =====================
    // DRAG SLINGSHOT VISUAL
    // =====================
    if (isDragging && dragStart && dragCurrent) {
      // Draw elastic band from tip to drag position
      ctx.save();
      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ff3366';
      ctx.shadowBlur = 8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(dragCurrent.x, dragCurrent.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw pull indicator circle at drag point
      ctx.beginPath();
      ctx.arc(dragCurrent.x, dragCurrent.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ff336688';
      ctx.fill();
      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Force indicator text near drag point
      ctx.fillStyle = '#ff3366';
      ctx.font = '9px "Press Start 2P"';
      ctx.textAlign = 'left';
      ctx.fillText(`${force}%`, dragCurrent.x + 12, dragCurrent.y - 4);
      ctx.fillText(`${angle}°`, dragCurrent.x + 12, dragCurrent.y + 10);

      ctx.restore();
    }

    // =====================
    // TRAJECTORY ARC (dotted)
    // =====================
    const scaleT = pixelsPerMeter;

    ctx.save();
    ctx.strokeStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur  = 4;
    ctx.lineWidth   = 2;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    const steps = 80;
    let landed = false;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * traj.tFly;
      const x = CATAPULT_X + traj.vx * t * scaleT;
      const y = groundY - (traj.vy * t - 0.5 * traj.g * t * t) * scaleT;
      if (x > W) break;
      if (i === 0) ctx.moveTo(x, Math.min(y, groundY));
      else ctx.lineTo(x, Math.min(y, groundY));
      if (y >= groundY && i > 0) { landed = true; break; }
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Peak height marker
    const peakT = traj.vy / traj.g;
    const peakX = CATAPULT_X + traj.vx * peakT * scaleT;
    const peakY = groundY - traj.height * scaleT;
    if (peakX > 0 && peakX < W && peakY > 10) {
      ctx.save();
      ctx.strokeStyle = '#39ff1466';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(peakX, peakY);
      ctx.lineTo(peakX, groundY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#39ff14';
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(`${traj.height.toFixed(1)}m`, peakX, peakY - 6);
      ctx.restore();
    }

    // Landing spot with target marker
    const landX = Math.min(CATAPULT_X + traj.dist * scaleT, W - 24);
    ctx.save();
    // Target rings
    ctx.strokeStyle = '#ff336644';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(landX, groundY, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(landX, groundY, 8, 0, Math.PI * 2); ctx.stroke();
    // Center dot
    ctx.fillStyle   = '#ff3366';
    ctx.shadowColor = '#ff3366';
    ctx.shadowBlur  = 10;
    ctx.beginPath();
    ctx.arc(landX, groundY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Distance label at landing
    ctx.save();
    ctx.fillStyle   = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur  = 4;
    ctx.font        = '10px "Press Start 2P"';
    ctx.textAlign   = 'center';
    ctx.fillText(`${traj.dist.toFixed(1)}m`, Math.min(landX, W - 50), groundY + 30);
    ctx.restore();

    // Angle arc indicator near catapult
    ctx.save();
    ctx.strokeStyle = planet.color + 'aa';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 24, -Math.PI, -(Math.PI) + armRad);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = planet.color;
    ctx.font      = '9px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText(`${angle}°`, pivotX + 28, pivotY - 8);
    ctx.restore();

    // Drag hint text (when not dragging)
    if (!isDragging) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('DRAG RUNNER TO AIM', cx, 20);
      ctx.fillText('& SET POWER', cx, 32);
      ctx.restore();
    }

  }, [angle, force, calcTrajectory, planet, isDragging, dragStart, dragCurrent]);

  const handleReady = () => {
    socket.updateConfig({ catapult: { angle, force } });
    socket.setReady(true);
  };

  const traj    = calcTrajectory();
  const isReady = me?.isReady;
  const v0      = traj.v0;
  const rad     = traj.rad;
  const g       = traj.g;

  return (
    <div className="min-h-screen px-4 py-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="font-pixel text-lg text-retro-yellow glow-text-gold mb-1">CATAPULT LAUNCH</h2>
        <p className="font-pixel text-[8px] text-retro-cyan/60 mb-2 tracking-widest">
          PHYSICS --- PROJECTILE MOTION
        </p>
        <p className="font-pixel text-[10px] px-6 text-retro-white/50 leading-relaxed mb-2">
          Set your launch angle and power to get a head start.
          Your catapult launches you to the starting zone ---
          a perfect landing saves time!
        </p>
        <p className="font-pixel text-[12px] mt-1" style={{ color: planet.color }}>
          {planet.label} &nbsp;---&nbsp;
          <span className="text-retro-white/70">g = {planet.gravity} m/s&sup2;</span>
        </p>
      </div>

      {/* Canvas */}
      <div className="pixel-card mb-4 p-1">
        <canvas
          ref={canvasRef}
          width={700}
          height={320}
          className="w-full cursor-grab active:cursor-grabbing"
          style={{ imageRendering: 'auto', touchAction: 'none' }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
      </div>

      {/* Controls + Physics side by side */}
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        {/* Angle control */}
        <div className="pixel-card">
          <p className="section-title">LAUNCH ANGLE (&theta;)</p>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-pixel text-[8px] text-retro-white/40">5&deg;</span>
            <input type="range" min={5} max={85} value={angle}
              onChange={e => setAngle(parseInt(e.target.value))}
              style={{ '--thumb-color': planet.color } as React.CSSProperties}
              className="flex-1" />
            <span className="font-pixel text-[8px] text-retro-white/40">85&deg;</span>
          </div>
          <p className="font-pixel text-xl text-center mt-1 glow-text" style={{ color: planet.color }}>{angle}&deg;</p>
          <div className="mt-2 stat-bar h-2">
            <div className="stat-bar-fill transition-all duration-200"
              style={{
                width: `${(1 - Math.abs(angle - 45) / 40) * 100}%`,
                background: Math.abs(angle - 45) < 10 ? '#39ff14' : '#ffd700',
              }} />
          </div>
          <p className="font-pixel text-[8px] text-center mt-1 text-retro-white/30">ANGLE EFFICIENCY</p>
        </div>

        {/* Force control */}
        <div className="pixel-card">
          <p className="section-title">LAUNCH FORCE</p>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-pixel text-[8px] text-retro-white/40">MIN</span>
            <input type="range" min={10} max={100} value={force}
              onChange={e => setForce(parseInt(e.target.value))}
              style={{ '--thumb-color': '#ff6b35' } as React.CSSProperties}
              className="flex-1" />
            <span className="font-pixel text-[8px] text-retro-white/40">MAX</span>
          </div>
          <p className="font-pixel text-xl text-retro-orange glow-text text-center mt-1">{force}%</p>
          <p className="font-pixel text-[10px] text-retro-white/40 text-center mt-1">
            v&#8320; = {v0.toFixed(1)} m/s
          </p>
          <div className="mt-2 stat-bar h-2">
            <div className="stat-bar-fill transition-all duration-200"
              style={{ width: `${force}%`, background: '#ff6b35' }} />
          </div>
          <p className="font-pixel text-[8px] text-center mt-1 text-retro-white/30">POWER OUTPUT</p>
        </div>

        {/* Physics formulas (live) */}
        <div className="pixel-card">
          <p className="section-title">PHYSICS FORMULAS</p>
          <div className="space-y-2 mt-2">
            <div>
              <p className="font-pixel text-[8px] text-retro-white/40">RANGE</p>
              <p className="font-pixel text-[8px] text-retro-cyan/70">
                R = v&#8320;&sup2;&middot;sin(2&theta;)/g
              </p>
              <p className="font-pixel text-[10px] text-retro-yellow glow-text">
                = {v0.toFixed(1)}&sup2; &times; {Math.sin(2 * rad).toFixed(3)} / {g}
              </p>
              <p className="font-pixel text-[12px] text-retro-yellow glow-text">
                = {traj.dist.toFixed(1)}m
              </p>
            </div>
            <div>
              <p className="font-pixel text-[8px] text-retro-white/40">MAX HEIGHT</p>
              <p className="font-pixel text-[8px] text-retro-cyan/70">
                H = v&#8320;&sup2;&middot;sin&sup2;(&theta;)/2g
              </p>
              <p className="font-pixel text-[10px] text-green-400 glow-text">
                = {traj.height.toFixed(1)}m
              </p>
            </div>
            <div>
              <p className="font-pixel text-[8px] text-retro-white/40">FLIGHT TIME</p>
              <p className="font-pixel text-[8px] text-retro-cyan/70">
                T = 2&middot;v&#8320;&middot;sin(&theta;)/g
              </p>
              <p className="font-pixel text-[10px] text-blue-400 glow-text">
                = {traj.tFly.toFixed(2)}s
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Projected results summary */}
      <div className="pixel-card mb-4">
        <p className="section-title mb-3">PROJECTED RESULTS</p>
        <div className="grid grid-cols-4 gap-4 text-center">
          {[
            { label: 'DISTANCE',   value: traj.dist.toFixed(1) + 'm',  color: '#ffd700' },
            { label: 'MAX HEIGHT', value: traj.height.toFixed(1) + 'm', color: '#39ff14' },
            { label: 'AIR TIME',   value: traj.tFly.toFixed(2) + 's',  color: '#00d4ff' },
            { label: 'HEAD START', value: (traj.dist * 0.15).toFixed(2) + 's', color: '#ff3366' },
          ].map(s => (
            <div key={s.label}>
              <p className="font-pixel text-[8px] text-retro-white/40 mb-1">{s.label}</p>
              <p className="font-pixel text-sm glow-text" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Planet gravity explanation */}
      <div className="pixel-card mb-5">
        <p className="section-title mb-2">GRAVITY EFFECT</p>
        <p className="font-pixel text-[10px] text-retro-white/50 leading-relaxed">
          {room?.currentPlanet === 'mars' || room?.currentPlanet === 'mercury'
            ? `On ${planet.label}, gravity is only ${planet.gravity} m/s\u00B2 (vs Earth's 9.8). Lower gravity means the projectile stays airborne longer, traveling farther and reaching greater heights with the same launch speed.`
            : `On EARTH, gravity is ${planet.gravity} m/s\u00B2. This is the baseline. On planets with lower gravity (like Mars at 3.7), the same launch would travel much farther!`
          }
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
