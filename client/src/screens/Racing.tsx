import React, { useState, useEffect, useRef } from 'react';

const PLANET_THEMES: Record<string, { bg1: string; bg2: string; ground: string; name: string; emoji: string }> = {
  earth: { bg1: '#87ceeb', bg2: '#4169e1', ground: '#228b22', name: 'Earth', emoji: '🌍' },
  mars: { bg1: '#ff6b35', bg2: '#8b2500', ground: '#cd853f', name: 'Mars', emoji: '🔴' },
  mercury: { bg1: '#808080', bg2: '#404040', ground: '#696969', name: 'Mercury', emoji: '⚫' },
};

const SECTION_EMOJIS: Record<string, string> = {
  sprint: '🏃',
  swim: '🏊',
  jump: '🤸',
  obstacle: '⚡',
};

const SECTION_NAMES: Record<string, string> = {
  sprint: 'Sprint',
  swim: 'Swim',
  jump: 'Jump',
  obstacle: 'Obstacle',
};

interface Props {
  socket: any;
}

export default function Racing({ socket }: Props) {
  const room = socket.roomState;
  const me = room?.players.find((p: any) => p.id === socket.playerId);
  const currentPlayer = room?.players.find((p: any) => p.id === room.currentPlayerId);
  const isMyTurn = room?.currentPlayerId === socket.playerId;
  const planet = PLANET_THEMES[room?.currentPlanet || 'earth'];

  const [raceState, setRaceState] = useState<'waiting' | 'running' | 'complete'>('waiting');
  const [currentSection, setCurrentSection] = useState(0);
  const [raceResult, setRaceResult] = useState<any>(null);
  const [sectionProgress, setSectionProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Draw race scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, planet.bg1);
      grad.addColorStop(1, planet.bg2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Clouds
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      [100, 300, 500].forEach((x, i) => {
        const y = 30 + i * 20;
        ctx.beginPath();
        ctx.arc(x + Math.sin(Date.now() / 2000 + i) * 10, y, 20, 0, Math.PI * 2);
        ctx.arc(x + 15 + Math.sin(Date.now() / 2000 + i) * 10, y - 5, 15, 0, Math.PI * 2);
        ctx.arc(x + 30 + Math.sin(Date.now() / 2000 + i) * 10, y, 20, 0, Math.PI * 2);
        ctx.fill();
      });

      // Ground
      const groundY = h - 80;
      ctx.fillStyle = planet.ground;
      ctx.fillRect(0, groundY, w, 80);

      // Ground texture (pixel blocks)
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      for (let x = 0; x < w; x += 16) {
        if (Math.random() > 0.7) {
          ctx.fillRect(x, groundY, 16, 8);
        }
      }

      // Section markers
      const sections = raceResult?.sections || [];
      const totalSections = sections.length || 4;
      const sectionWidth = (w - 100) / totalSections;

      for (let i = 0; i < totalSections; i++) {
        const x = 50 + i * sectionWidth;
        const sectionName = sections[i]?.section || ['sprint', 'swim', 'jump', 'obstacle'][i];

        // Section divider
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, groundY - 60);
        ctx.lineTo(x, groundY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Section label
        ctx.fillStyle = i <= currentSection ? '#ffd700' : 'rgba(255,255,255,0.5)';
        ctx.font = '10px "Press Start 2P"';
        ctx.fillText(SECTION_EMOJIS[sectionName] || '?', x + sectionWidth / 2 - 8, groundY - 45);
        ctx.font = '7px "Press Start 2P"';
        ctx.fillText(SECTION_NAMES[sectionName] || sectionName, x + 5, groundY - 30);
      }

      // Runner
      if (raceState !== 'waiting') {
        const runnerX = 50 + currentSection * sectionWidth + sectionProgress * sectionWidth;
        const runnerY = groundY - 24;

        // Simple pixel character
        ctx.fillStyle = '#ffd700';
        // Head
        ctx.fillRect(runnerX + 2, runnerY - 12, 8, 8);
        // Body
        ctx.fillStyle = '#e91e8c';
        ctx.fillRect(runnerX, runnerY - 4, 12, 12);
        // Legs (animated)
        ctx.fillStyle = '#4169e1';
        const legOffset = Math.sin(Date.now() / 100) * 3;
        ctx.fillRect(runnerX + 1, runnerY + 8, 4, 8 + legOffset);
        ctx.fillRect(runnerX + 7, runnerY + 8, 4, 8 - legOffset);

        // Motion lines when running
        if (raceState === 'running') {
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.lineWidth = 1;
          for (let l = 0; l < 3; l++) {
            const ly = runnerY + l * 6 - 4;
            ctx.beginPath();
            ctx.moveTo(runnerX - 5 - l * 4, ly);
            ctx.lineTo(runnerX - 15 - l * 4, ly);
            ctx.stroke();
          }
        }
      }

      // Finish line
      const finishX = w - 40;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (let y = groundY - 50; y < groundY; y += 8) {
        for (let x = finishX; x < finishX + 16; x += 8) {
          if ((x + y) % 16 === 0) {
            ctx.fillRect(x, y, 8, 8);
          }
        }
      }
    };

    const animate = () => {
      draw();
      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animRef.current);
  }, [planet, raceState, currentSection, sectionProgress, raceResult]);

  const startRace = async () => {
    setRaceState('running');
    const res = await socket.runRace();

    if (res.success && res.result) {
      setRaceResult(res.result);

      // Animate through sections
      const sections = res.result.sections;
      for (let i = 0; i < sections.length; i++) {
        setCurrentSection(i);
        // Animate progress within section
        const duration = Math.min(sections[i].time * 100, 2000); // cap animation time
        const startTime = Date.now();
        await new Promise<void>(resolve => {
          const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            setSectionProgress(progress);
            if (progress < 1) requestAnimationFrame(tick);
            else resolve();
          };
          tick();
        });
      }

      setRaceState('complete');
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      <h2 className="font-pixel text-xl text-retro-yellow text-center mb-2">
        {planet.emoji} Race — {planet.name}
      </h2>

      {/* Turn indicator */}
      <div className="text-center mb-4">
        {isMyTurn ? (
          <p className="font-pixel text-sm text-retro-green animate-pixel-pulse">Your Turn!</p>
        ) : (
          <p className="font-pixel text-[10px] text-white/60">
            {currentPlayer?.name || 'Unknown'} is racing...
          </p>
        )}
      </div>

      {/* Race Canvas */}
      <div className="pixel-card mb-6">
        <canvas
          ref={canvasRef}
          width={700}
          height={250}
          className="w-full"
          style={{ imageRendering: 'auto' }}
        />
      </div>

      {/* Section Results */}
      {raceResult && (
        <div className="pixel-card mb-6">
          <h3 className="font-pixel text-[10px] text-retro-cyan mb-3">Section Times</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {raceResult.sections.map((s: any, i: number) => (
              <div key={i} className="text-center p-2 border border-white/10">
                <p className="text-xl mb-1">{SECTION_EMOJIS[s.section]}</p>
                <p className="font-pixel text-[8px] text-white/70">{SECTION_NAMES[s.section]}</p>
                <p className="font-pixel text-sm text-retro-yellow">{s.time.toFixed(2)}s</p>
                <p className="font-pixel text-[6px] text-white/40">
                  Fatigue: {s.fatigue.toFixed(0)}%
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 text-center">
            <p className="font-pixel text-[8px] text-white/50">Catapult Head Start: -{raceResult.catapultResult.headStart.toFixed(2)}s</p>
            <p className="font-pixel text-lg text-retro-green mt-1">
              Total: {raceResult.totalTime.toFixed(2)}s
            </p>
          </div>

          {/* Events */}
          <div className="mt-4 max-h-32 overflow-y-auto">
            {raceResult.sections.flatMap((s: any) => s.events).map((event: string, i: number) => (
              <p key={i} className="font-pixel text-[6px] text-retro-cyan mb-1">
                → {event}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="text-center">
        {isMyTurn && raceState === 'waiting' && (
          <button onClick={startRace} className="pixel-btn bg-retro-pink text-white">
            Start Race!
          </button>
        )}
        {raceState === 'running' && (
          <p className="font-pixel text-sm text-retro-yellow animate-pulse">Racing...</p>
        )}
        {raceState === 'complete' && (
          <p className="font-pixel text-sm text-retro-green">Race Complete!</p>
        )}
      </div>
    </div>
  );
}
