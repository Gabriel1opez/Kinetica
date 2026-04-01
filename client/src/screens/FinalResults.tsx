import React from 'react';

const AVATARS = ['🏃', '🏋️', '🤸', '🏊', '⚡', '🔬', '🧪', '🚀'];

interface Props {
  socket: any;
  onBackToMenu: () => void;
}

export default function FinalResults({ socket, onBackToMenu }: Props) {
  const room = socket.roomState;
  if (!room) return null;

  const me = room.players.find((p: any) => p.id === socket.playerId);

  // Sort by total time across all planets
  const sorted = [...room.players].sort((a: any, b: any) => a.totalTime - b.totalTime);

  // Collect all feedback from all races
  const allFeedback = me?.raceResults?.flatMap((r: any) =>
    r.feedback.map((fb: string) => ({ planet: r.planet, feedback: fb }))
  ) || [];

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      {/* Trophy Animation */}
      <div className="text-center mb-8">
        <div className="text-6xl animate-float mb-4">🏆</div>
        <h2 className="font-pixel text-2xl text-retro-yellow glow-text mb-2">
          RACE COMPLETE
        </h2>
        <p className="font-pixel text-[10px] text-retro-cyan">
          Final Standings Across All Planets
        </p>
      </div>

      {/* Final Leaderboard */}
      <div className="pixel-card mb-8">
        <h3 className="font-pixel text-xs text-retro-cyan mb-4 text-center">Final Rankings</h3>
        <div className="space-y-4">
          {sorted.map((player: any, i: number) => {
            const medals = ['🥇', '🥈', '🥉'];
            const isWinner = i === 0;
            return (
              <div
                key={player.id}
                className={`flex items-center gap-4 p-4 border-2 transition-all ${
                  isWinner ? 'border-retro-yellow bg-retro-yellow/10' :
                  player.id === socket.playerId ? 'border-retro-cyan' : 'border-white/10'
                }`}
              >
                <span className="text-3xl">{medals[i] || `#${i + 1}`}</span>
                <span className="text-2xl">{AVATARS[player.avatar]}</span>
                <div className="flex-1">
                  <p className="font-pixel text-sm text-white">
                    {player.name}
                    {player.id === socket.playerId && ' (You)'}
                  </p>
                  {/* Per-planet times */}
                  <div className="flex gap-3 mt-1">
                    {player.raceResults?.map((r: any, j: number) => (
                      <span key={j} className="font-pixel text-[7px] text-white/50">
                        {r.planet === 'earth' ? '🌍' : r.planet === 'mars' ? '🔴' : '⚫'}
                        {r.totalTime.toFixed(1)}s
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-pixel text-xl text-retro-yellow">
                    {player.totalTime.toFixed(2)}s
                  </p>
                  <p className="font-pixel text-[7px] text-white/40">total time</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comprehensive Science Review */}
      <div className="pixel-card mb-8">
        <h3 className="font-pixel text-sm text-retro-pink mb-2 text-center">
          🔬 Complete Science Review
        </h3>
        <p className="font-pixel text-[7px] text-white/50 text-center mb-6">
          How real science impacted your gameplay
        </p>

        {/* Group feedback by planet */}
        {['earth', 'mars', 'mercury'].map(planet => {
          const planetFeedback = allFeedback.filter((f: any) => f.planet === planet);
          if (planetFeedback.length === 0) return null;
          return (
            <div key={planet} className="mb-6">
              <h4 className="font-pixel text-[10px] text-retro-cyan mb-2">
                {planet === 'earth' ? '🌍 Earth' : planet === 'mars' ? '🔴 Mars' : '⚫ Mercury'}
              </h4>
              <div className="space-y-2">
                {planetFeedback.map((f: any, i: number) => (
                  <div key={i} className="p-2 border border-white/10 bg-black/20">
                    <p className="font-pixel text-[7px] text-white/80 leading-relaxed">
                      {f.feedback}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Science Concepts Summary */}
        <div className="mt-6 p-4 border border-retro-cyan/30 bg-retro-cyan/5">
          <h4 className="font-pixel text-[10px] text-retro-cyan mb-3">
            Key Science Concepts Applied
          </h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="font-pixel text-[8px] text-retro-pink mb-1">Sports Medicine (SEHS)</p>
              <ul className="space-y-1">
                <li className="font-pixel text-[6px] text-white/60">• Muscle group specialization</li>
                <li className="font-pixel text-[6px] text-white/60">• ATP-PC / Anaerobic / Aerobic systems</li>
                <li className="font-pixel text-[6px] text-white/60">• Fatigue & oxygen at altitude</li>
                <li className="font-pixel text-[6px] text-white/60">• Sliding filament theory</li>
              </ul>
            </div>
            <div>
              <p className="font-pixel text-[8px] text-retro-yellow mb-1">Physics</p>
              <ul className="space-y-1">
                <li className="font-pixel text-[6px] text-white/60">• Projectile motion (R = v²sin2θ/g)</li>
                <li className="font-pixel text-[6px] text-white/60">• Gravity varies by planet</li>
                <li className="font-pixel text-[6px] text-white/60">• F = ma (mass affects acceleration)</li>
                <li className="font-pixel text-[6px] text-white/60">• Optimal launch angle = 45°</li>
              </ul>
            </div>
            <div>
              <p className="font-pixel text-[8px] text-retro-green mb-1">Chemistry</p>
              <ul className="space-y-1">
                <li className="font-pixel text-[6px] text-white/60">• Aerobic respiration equation</li>
                <li className="font-pixel text-[6px] text-white/60">• Na⁺/K⁺ pump & electrolytes</li>
                <li className="font-pixel text-[6px] text-white/60">• Hemoglobin & oxygen transport</li>
                <li className="font-pixel text-[6px] text-white/60">• pH buffering & lactic acid</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={onBackToMenu}
          className="pixel-btn bg-retro-pink text-white"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
