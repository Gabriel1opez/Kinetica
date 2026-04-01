import { useState, useEffect } from 'react';

const MUSCLES = [
  {
    key:    'quadriceps',
    label:  'QUADS',
    full:   'Quadriceps',
    func:   'Knee extension',
    effect: 'Sprint Speed',
    color:  '#ff3366',
    game:   'Faster horizontal movement',
  },
  {
    key:    'hamstrings',
    label:  'HAMS',
    full:   'Hamstrings',
    func:   'Hip extension',
    effect: 'Acceleration',
    color:  '#ffd700',
    game:   'Quicker speed build-up',
  },
  {
    key:    'calves',
    label:  'CALV',
    full:   'Calves',
    func:   'Plantar flexion',
    effect: 'Jump Height',
    color:  '#39ff14',
    game:   'Higher jumps over obstacles',
  },
  {
    key:    'core',
    label:  'CORE',
    full:   'Core',
    func:   'Stability',
    effect: 'Efficiency',
    color:  '#00d4ff',
    game:   'Better control + stamina',
  },
  {
    key:    'upperBody',
    label:  'UPPR',
    full:   'Upper Body',
    func:   'Arm propulsion',
    effect: 'Swim Speed',
    color:  '#cc88ff',
    game:   'Swim section advantage',
  },
];

interface Props { socket: any; }

export default function Configuration({ socket }: Props) {
  const room = socket.roomState;
  const me   = room?.players.find((p: any) => p.id === socket.playerId);

  const [muscles, setMuscles] = useState<Record<string, boolean>>({
    quadriceps: false, hamstrings: false, calves: false, core: false, upperBody: false,
  });
  const [energy, setEnergy] = useState({ atpPc: 33, anaerobic: 34, aerobic: 33 });
  const [mass, setMass]     = useState(70);

  const selectedCount = Object.values(muscles).filter(Boolean).length;

  const toggleMuscle = (key: string) => {
    setMuscles(prev => {
      if (prev[key]) return { ...prev, [key]: false };
      if (selectedCount >= 3) return prev;
      return { ...prev, [key]: true };
    });
  };

  const adjustEnergy = (system: string, value: number) => {
    setEnergy(prev => {
      const next = { ...prev, [system]: value };
      const total = next.atpPc + next.anaerobic + next.aerobic;
      const diff  = total - 100;
      if (diff !== 0) {
        const others = (Object.keys(next) as (keyof typeof next)[]).filter(k => k !== system);
        const perOther  = Math.floor(diff / others.length);
        const remainder = diff % others.length;
        others.forEach((k, i) => {
          next[k] = Math.max(0, next[k] - perOther - (i === 0 ? remainder : 0));
        });
      }
      return next;
    });
  };

  useEffect(() => { socket.updateConfig({ muscles, energy, mass }); }, [muscles, energy, mass]);

  const handleReady = () => {
    if (selectedCount < 1) return;
    socket.updateConfig({ muscles, energy, mass });
    socket.setReady(true);
  };

  const isReady = me?.isReady;

  // Derived preview stats
  const stats = [
    { label: 'SPRINT', val: 40 + (muscles.quadriceps ? 40 : 0) + (muscles.hamstrings ? 15 : 0) + (energy.atpPc > 50 ? 15 : 0) },
    { label: 'SWIM',   val: 40 + (muscles.upperBody  ? 45 : 0) + (muscles.core ? 10 : 0) },
    { label: 'JUMP',   val: 40 + (muscles.calves     ? 45 : 0) + (muscles.hamstrings ? 10 : 0) },
    { label: 'STAMINA',val: 35 + (muscles.core ? 40 : 0) + (energy.aerobic > 50 ? 25 : 0) },
  ];

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-pixel text-lg text-retro-yellow glow-text-gold mb-1">RUNNER CONFIG</h2>
        <p className="font-pixel text-[7px] text-retro-cyan/60 tracking-widest">SPORTS MEDICINE & EXERCISE PHYSIOLOGY</p>
      </div>

      {/* Muscle Selection */}
      <div className="pixel-card mb-5">
        <div className="flex items-baseline justify-between mb-1">
          <p className="section-title">MUSCLE TRAINING</p>
          <p className="font-pixel text-[7px] text-retro-white/40">{selectedCount}/3 SELECTED</p>
        </div>
        <p className="section-subtitle">Select up to 3 muscle groups to enhance for the race</p>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {MUSCLES.map(m => {
            const selected = muscles[m.key];
            const disabled = !selected && selectedCount >= 3;
            return (
              <button key={m.key} onClick={() => toggleMuscle(m.key)}
                disabled={disabled}
                className="p-3 border-2 transition-all text-center cursor-pointer"
                style={{
                  borderColor: selected ? m.color : '#1e1e5e',
                  background:  selected ? `${m.color}18` : 'rgba(0,0,0,0.3)',
                  boxShadow:   selected ? `0 0 12px ${m.color}44` : 'none',
                  opacity:     disabled ? 0.3 : 1,
                  transform:   selected ? 'scale(1.04)' : 'scale(1)',
                }}>
                {/* Icon block */}
                <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center font-pixel text-[8px] border"
                  style={{ borderColor: m.color, background: `${m.color}22`, color: m.color }}>
                  {m.label}
                </div>
                <p className="font-pixel text-[7px] text-retro-white mb-1">{m.full}</p>
                <p className="font-pixel text-[6px]" style={{ color: m.color }}>{m.func}</p>
                <p className="font-pixel text-[5px] text-retro-white/40 mt-1">{m.game}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Energy Systems */}
      <div className="pixel-card mb-5">
        <p className="section-title">ENERGY ALLOCATION</p>
        <p className="section-subtitle">Distribute 100 points — affects which race sections you excel in</p>

        {[
          { key: 'atpPc',    label: 'ATP-PC',    desc: '0–10s explosive burst',   color: '#ff3366', thumb: '#ff3366' },
          { key: 'anaerobic',label: 'ANAEROBIC', desc: '10–60s high intensity',  color: '#ff6b35', thumb: '#ff6b35' },
          { key: 'aerobic',  label: 'AEROBIC',   desc: '60s+ sustained effort',  color: '#39ff14', thumb: '#39ff14' },
        ].map(sys => (
          <div key={sys.key} className="mb-4">
            <div className="flex justify-between items-end mb-1">
              <div>
                <span className="font-pixel text-[8px]" style={{ color: sys.color }}>{sys.label}</span>
                <span className="font-pixel text-[6px] text-retro-white/40 ml-3">{sys.desc}</span>
              </div>
              <span className="font-pixel text-[10px] text-retro-white">
                {energy[sys.key as keyof typeof energy]}%
              </span>
            </div>
            {/* Progress bar visual */}
            <div className="stat-bar mb-1.5">
              <div className="stat-bar-fill transition-all duration-200"
                style={{ width: `${energy[sys.key as keyof typeof energy]}%`, background: sys.color,
                         boxShadow: `0 0 6px ${sys.color}` }} />
            </div>
            <input type="range" min={0} max={100}
              value={energy[sys.key as keyof typeof energy]}
              onChange={e => adjustEnergy(sys.key, parseInt(e.target.value))}
              style={{ '--thumb-color': sys.thumb } as React.CSSProperties}
              className="w-full" />
          </div>
        ))}

        <div className="flex justify-between items-center">
          <p className="font-pixel text-[6px] text-retro-white/30">TOTAL MUST EQUAL 100</p>
          <p className={`font-pixel text-[8px] ${energy.atpPc + energy.anaerobic + energy.aerobic === 100 ? 'text-retro-green' : 'text-retro-red'}`}>
            {energy.atpPc + energy.anaerobic + energy.aerobic}/100
          </p>
        </div>
      </div>

      {/* Body Mass */}
      <div className="pixel-card mb-5">
        <p className="section-title">BODY MASS</p>
        <p className="section-subtitle">F = ma — heavier means more momentum but slower acceleration</p>
        <div className="flex items-center gap-3">
          <span className="font-pixel text-[7px] text-retro-white/40">50kg</span>
          <input type="range" min={50} max={120} value={mass}
            onChange={e => setMass(parseInt(e.target.value))}
            style={{ '--thumb-color': '#00d4ff' } as React.CSSProperties}
            className="flex-1" />
          <span className="font-pixel text-[7px] text-retro-white/40">120kg</span>
          <span className="font-pixel text-sm text-retro-cyan glow-text-cyan w-16 text-right">{mass}kg</span>
        </div>
      </div>

      {/* Preview stats */}
      <div className="pixel-card mb-8">
        <p className="font-pixel text-[8px] text-retro-cyan mb-3">PERFORMANCE PREVIEW</p>
        <div className="grid grid-cols-4 gap-3">
          {stats.map(stat => {
            const pct   = Math.min(stat.val, 100);
            const color = pct > 70 ? '#39ff14' : pct > 50 ? '#ffd700' : '#ff073a';
            return (
              <div key={stat.label}>
                <p className="font-pixel text-[6px] text-retro-white/50 mb-1">{stat.label}</p>
                <div className="stat-bar h-4">
                  <div className="stat-bar-fill transition-all duration-500"
                    style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }} />
                </div>
                <p className="font-pixel text-[6px] mt-1" style={{ color }}>{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mass hint */}
      <div className="text-center mb-4">
        <p className="font-pixel text-[6px] text-retro-white/30">
          MASS: {mass}kg — {mass < 65 ? 'LIGHT: BETTER JUMPS' : mass > 90 ? 'HEAVY: MORE MOMENTUM' : 'BALANCED BUILD'}
        </p>
      </div>

      <div className="text-center">
        <button onClick={handleReady} disabled={selectedCount < 1 || !!isReady}
          className={selectedCount < 1 || isReady ? 'btn-ghost px-8 py-3' : 'btn-green px-8 py-3'}>
          {isReady ? 'WAITING FOR OTHERS...' : 'LOCK IN CONFIG'}
        </button>
        {selectedCount < 1 && (
          <p className="font-pixel text-[7px] text-retro-red mt-2">SELECT AT LEAST 1 MUSCLE GROUP</p>
        )}
      </div>
    </div>
  );
}
