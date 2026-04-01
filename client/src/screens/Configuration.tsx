import React, { useState, useEffect } from 'react';

const MUSCLES = [
  { key: 'quadriceps', name: 'Quadriceps', icon: '🦵', func: 'Knee extension', effect: 'Sprint Speed', color: '#ff6b35' },
  { key: 'hamstrings', name: 'Hamstrings', icon: '🦿', func: 'Hip extension', effect: 'Acceleration', color: '#e91e8c' },
  { key: 'calves', name: 'Calves', icon: '🦶', func: 'Plantar flexion', effect: 'Jump Height', color: '#ffd700' },
  { key: 'core', name: 'Core', icon: '💪', func: 'Stability', effect: 'Efficiency', color: '#00d4ff' },
  { key: 'upperBody', name: 'Upper Body', icon: '🏋️', func: 'Arm propulsion', effect: 'Swim Speed', color: '#39ff14' },
];

interface Props {
  socket: any;
}

export default function Configuration({ socket }: Props) {
  const room = socket.roomState;
  const me = room?.players.find((p: any) => p.id === socket.playerId);

  const [muscles, setMuscles] = useState<Record<string, boolean>>({
    quadriceps: false, hamstrings: false, calves: false, core: false, upperBody: false,
  });
  const [energy, setEnergy] = useState({ atpPc: 33, anaerobic: 34, aerobic: 33 });
  const [mass, setMass] = useState(70);

  const selectedCount = Object.values(muscles).filter(Boolean).length;

  const toggleMuscle = (key: string) => {
    setMuscles(prev => {
      const next = { ...prev };
      if (next[key]) {
        next[key] = false;
      } else if (selectedCount < 3) {
        next[key] = true;
      }
      return next;
    });
  };

  const adjustEnergy = (system: string, value: number) => {
    setEnergy(prev => {
      const next = { ...prev, [system]: value };
      const total = next.atpPc + next.anaerobic + next.aerobic;
      const diff = total - 100;

      // Redistribute excess to other systems
      if (diff !== 0) {
        const others = Object.keys(next).filter(k => k !== system) as (keyof typeof next)[];
        const perOther = Math.floor(diff / others.length);
        const remainder = diff % others.length;
        others.forEach((k, i) => {
          next[k] = Math.max(0, next[k] - perOther - (i === 0 ? remainder : 0));
        });
      }

      return next;
    });
  };

  useEffect(() => {
    socket.updateConfig({ muscles, energy, mass });
  }, [muscles, energy, mass]);

  const handleReady = () => {
    if (selectedCount < 1) return;
    socket.updateConfig({ muscles, energy, mass });
    socket.setReady(true);
  };

  const isReady = me?.isReady;

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      <h2 className="font-pixel text-xl text-retro-yellow text-center mb-2">
        Runner Configuration
      </h2>
      <p className="font-pixel text-[8px] text-retro-cyan text-center mb-8">
        Sports Medicine & Exercise Physiology
      </p>

      {/* Muscle Selection */}
      <div className="pixel-card mb-6">
        <h3 className="font-pixel text-xs text-retro-pink mb-1">Muscle Training</h3>
        <p className="font-pixel text-[8px] text-white/50 mb-4">
          Select 3 muscle groups to enhance ({selectedCount}/3)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {MUSCLES.map(m => {
            const selected = muscles[m.key];
            return (
              <button
                key={m.key}
                onClick={() => toggleMuscle(m.key)}
                className={`p-3 border-2 transition-all cursor-pointer text-center
                  ${selected
                    ? 'border-retro-yellow bg-retro-yellow/10 scale-105'
                    : selectedCount >= 3
                      ? 'border-white/10 opacity-40 cursor-not-allowed'
                      : 'border-white/20 hover:border-white/50'
                  }`}
              >
                <span className="text-3xl block mb-2">{m.icon}</span>
                <p className="font-pixel text-[8px] text-white">{m.name}</p>
                <p className="font-pixel text-[6px] mt-1" style={{ color: m.color }}>
                  {m.func}
                </p>
                <p className="font-pixel text-[6px] text-white/60 mt-1">
                  → {m.effect}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Energy System Allocation */}
      <div className="pixel-card mb-6">
        <h3 className="font-pixel text-xs text-retro-pink mb-1">Energy System Allocation</h3>
        <p className="font-pixel text-[8px] text-white/50 mb-4">
          Distribute 100 points across energy systems
        </p>

        {[
          { key: 'atpPc', name: 'ATP-PC', desc: 'Explosive power (0-10s)', color: '#ff073a' },
          { key: 'anaerobic', name: 'Anaerobic', desc: 'Medium bursts (10-60s)', color: '#ff6b35' },
          { key: 'aerobic', name: 'Aerobic', desc: 'Endurance (60s+)', color: '#39ff14' },
        ].map(sys => (
          <div key={sys.key} className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="font-pixel text-[8px]" style={{ color: sys.color }}>
                {sys.name}
              </span>
              <span className="font-pixel text-[10px] text-white">
                {energy[sys.key as keyof typeof energy]}
              </span>
            </div>
            <p className="font-pixel text-[6px] text-white/40 mb-1">{sys.desc}</p>
            <input
              type="range"
              min={0}
              max={100}
              value={energy[sys.key as keyof typeof energy]}
              onChange={e => adjustEnergy(sys.key, parseInt(e.target.value))}
              className="w-full h-3 appearance-none bg-black/50 border border-white/20 cursor-pointer"
              style={{
                accentColor: sys.color,
              }}
            />
          </div>
        ))}
        <p className="font-pixel text-[8px] text-white/30 text-right">
          Total: {energy.atpPc + energy.anaerobic + energy.aerobic}/100
        </p>
      </div>

      {/* Body Mass */}
      <div className="pixel-card mb-8">
        <h3 className="font-pixel text-xs text-retro-pink mb-1">Body Mass</h3>
        <p className="font-pixel text-[8px] text-white/50 mb-4">
          Heavier = more momentum but slower acceleration (F = ma)
        </p>
        <div className="flex items-center gap-4">
          <span className="font-pixel text-[8px] text-white/50">50kg</span>
          <input
            type="range"
            min={50}
            max={120}
            value={mass}
            onChange={e => setMass(parseInt(e.target.value))}
            className="flex-1 h-3 appearance-none bg-black/50 border border-white/20 cursor-pointer"
            style={{ accentColor: '#00d4ff' }}
          />
          <span className="font-pixel text-[8px] text-white/50">120kg</span>
          <span className="font-pixel text-sm text-retro-cyan w-16 text-right">{mass}kg</span>
        </div>
      </div>

      {/* Preview stats */}
      <div className="pixel-card mb-8">
        <h3 className="font-pixel text-[10px] text-retro-cyan mb-3">Performance Preview</h3>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Sprint', val: muscles.quadriceps ? 85 : muscles.hamstrings ? 65 : 50 },
            { label: 'Swim', val: muscles.upperBody ? 85 : 50 },
            { label: 'Jump', val: muscles.calves ? 85 : 50 },
            { label: 'Efficiency', val: muscles.core ? 85 : 50 },
          ].map(stat => (
            <div key={stat.label}>
              <p className="font-pixel text-[6px] text-white/60 mb-1">{stat.label}</p>
              <div className="h-2 bg-black/50 border border-white/20">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${stat.val}%`,
                    background: stat.val > 70 ? '#39ff14' : stat.val > 50 ? '#ffd700' : '#ff073a',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={handleReady}
          disabled={selectedCount < 1 || isReady}
          className={`pixel-btn ${isReady ? 'bg-gray-600 text-gray-400' : 'bg-retro-green text-black'}`}
        >
          {isReady ? 'Waiting for others...' : 'Lock In Configuration'}
        </button>
      </div>
    </div>
  );
}
