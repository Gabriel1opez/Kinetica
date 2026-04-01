import React, { useState, useEffect } from 'react';

const ELEMENTS = [
  { symbol: 'C₆H₁₂O₆', name: 'Glucose', category: 'organic', color: '#ffd700' },
  { symbol: 'O₂', name: 'Oxygen', category: 'gas', color: '#87ceeb' },
  { symbol: 'Na⁺', name: 'Sodium Ion', category: 'ion', color: '#ff8c00' },
  { symbol: 'K⁺', name: 'Potassium Ion', category: 'ion', color: '#9370db' },
  { symbol: 'Fe', name: 'Iron', category: 'metal', color: '#cd853f' },
  { symbol: 'Ca²⁺', name: 'Calcium Ion', category: 'ion', color: '#f5f5dc' },
  { symbol: 'H₂O', name: 'Water', category: 'compound', color: '#4169e1' },
  { symbol: 'ATP', name: 'Adenosine Triphosphate', category: 'organic', color: '#39ff14' },
  { symbol: 'CO₂', name: 'Carbon Dioxide', category: 'gas', color: '#808080' },
  { symbol: 'N₂', name: 'Nitrogen', category: 'gas', color: '#b0c4de' },
  { symbol: 'Mg²⁺', name: 'Magnesium Ion', category: 'ion', color: '#98fb98' },
  { symbol: 'PO₄³⁻', name: 'Phosphate', category: 'ion', color: '#dda0dd' },
  { symbol: 'HCO₃⁻', name: 'Bicarbonate', category: 'ion', color: '#f0e68c' },
  { symbol: 'Creatine', name: 'Creatine', category: 'organic', color: '#ff6347' },
  { symbol: 'Caffeine', name: 'Caffeine', category: 'organic', color: '#8b4513' },
  { symbol: 'Lactic Acid', name: 'Lactic Acid', category: 'organic', color: '#ff4500' },
];

const CATEGORY_COLORS: Record<string, string> = {
  organic: '#ffd700',
  gas: '#87ceeb',
  ion: '#ff8c00',
  metal: '#cd853f',
  compound: '#4169e1',
};

interface Props {
  socket: any;
}

export default function PotionCrafting({ socket }: Props) {
  const room = socket.roomState;
  const me = room?.players.find((p: any) => p.id === socket.playerId);
  const [selected, setSelected] = useState<string[]>([]);
  const [craftedPotions, setCraftedPotions] = useState<any[]>(me?.config?.potions || []);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [reacting, setReacting] = useState(false);

  const toggleElement = (symbol: string) => {
    if (reacting) return;
    setSelected(prev =>
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : prev.length < 2 ? [...prev, symbol] : prev
    );
    setMessage('');
  };

  const handleCraft = async () => {
    if (selected.length !== 2) return;
    if (craftedPotions.length >= 3) {
      setMessage('Maximum 3 potions!');
      setMessageType('error');
      return;
    }

    setReacting(true);

    // Animate "reaction"
    await new Promise(r => setTimeout(r, 1500));

    const result = await socket.craftPotion(selected);
    setReacting(false);

    if (result.success && result.potion) {
      setCraftedPotions(prev => [...prev, result.potion]);
      setMessage(`Created: ${result.potion.name}!`);
      setMessageType('success');
      setSelected([]);
    } else {
      setMessage(result.error || 'No reaction!');
      setMessageType('error');
    }
  };

  const handleReady = () => {
    socket.setReady(true);
  };

  const isReady = me?.isReady;

  return (
    <div className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
      <h2 className="font-pixel text-xl text-retro-yellow text-center mb-2">
        Potion Crafting Lab
      </h2>
      <p className="font-pixel text-[8px] text-retro-cyan text-center mb-8">
        Chemistry — Combine elements to create performance-enhancing potions
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Periodic Table */}
        <div className="md:col-span-2">
          <div className="pixel-card">
            <h3 className="font-pixel text-[10px] text-retro-pink mb-3">Elements</h3>
            <div className="flex gap-2 mb-3 flex-wrap">
              {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                <span key={cat} className="font-pixel text-[6px] flex items-center gap-1">
                  <span className="w-2 h-2 inline-block" style={{ background: color }} />
                  {cat}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {ELEMENTS.map(el => {
                const isSelected = selected.includes(el.symbol);
                return (
                  <button
                    key={el.symbol}
                    onClick={() => toggleElement(el.symbol)}
                    className={`p-2 border-2 transition-all cursor-pointer text-center min-h-[60px] flex flex-col items-center justify-center
                      ${isSelected
                        ? 'border-retro-yellow bg-retro-yellow/20 scale-110 z-10'
                        : 'border-white/20 hover:border-white/50'
                      }`}
                    style={{
                      borderColor: isSelected ? '#ffd700' : undefined,
                      background: isSelected ? `${el.color}33` : undefined,
                    }}
                  >
                    <span className="font-pixel text-[8px] block" style={{ color: el.color }}>
                      {el.symbol}
                    </span>
                    <span className="font-pixel text-[5px] text-white/50 mt-1">
                      {el.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Crafting Area */}
        <div className="space-y-4">
          {/* Reaction Chamber */}
          <div className="pixel-card text-center">
            <h3 className="font-pixel text-[10px] text-retro-pink mb-3">Reaction Chamber</h3>

            <div className="flex items-center justify-center gap-2 mb-4 min-h-[60px]">
              {selected[0] ? (
                <span className="font-pixel text-sm" style={{
                  color: ELEMENTS.find(e => e.symbol === selected[0])?.color
                }}>
                  {selected[0]}
                </span>
              ) : (
                <span className="font-pixel text-[8px] text-white/30">?</span>
              )}

              <span className="font-pixel text-xs text-retro-yellow">+</span>

              {selected[1] ? (
                <span className="font-pixel text-sm" style={{
                  color: ELEMENTS.find(e => e.symbol === selected[1])?.color
                }}>
                  {selected[1]}
                </span>
              ) : (
                <span className="font-pixel text-[8px] text-white/30">?</span>
              )}
            </div>

            {reacting && (
              <div className="mb-4">
                <div className="text-2xl animate-spin">⚗️</div>
                <p className="font-pixel text-[8px] text-retro-yellow mt-2 animate-pulse">
                  Reacting...
                </p>
              </div>
            )}

            {message && (
              <p className={`font-pixel text-[8px] mb-3 ${messageType === 'success' ? 'text-retro-green' : 'text-retro-red'}`}>
                {message}
              </p>
            )}

            <button
              onClick={handleCraft}
              disabled={selected.length !== 2 || reacting || craftedPotions.length >= 3}
              className={`pixel-btn w-full text-[10px] ${
                selected.length === 2 && !reacting ? 'bg-retro-pink text-white' : 'bg-gray-700 text-gray-400'
              }`}
            >
              {reacting ? 'Mixing...' : 'Combine!'}
            </button>
          </div>

          {/* Crafted Potions */}
          <div className="pixel-card">
            <h3 className="font-pixel text-[10px] text-retro-pink mb-3">
              Potions ({craftedPotions.length}/3)
            </h3>
            {craftedPotions.length === 0 ? (
              <p className="font-pixel text-[7px] text-white/40">No potions crafted yet</p>
            ) : (
              <div className="space-y-2">
                {craftedPotions.map((p: any, i: number) => (
                  <div key={i} className="p-2 border border-white/20" style={{ borderColor: p.color }}>
                    <p className="font-pixel text-[8px]" style={{ color: p.color }}>
                      🧪 {p.name}
                    </p>
                    <p className="font-pixel text-[6px] text-white/60 mt-1">{p.effect}</p>
                    <p className="font-pixel text-[6px] text-retro-green mt-1">
                      +{p.magnitude} {p.stat.replace(/_/g, ' ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleReady}
            disabled={isReady}
            className={`pixel-btn w-full ${isReady ? 'bg-gray-600 text-gray-400' : 'bg-retro-green text-black'}`}
          >
            {isReady ? 'Waiting...' : 'Done Crafting'}
          </button>
        </div>
      </div>
    </div>
  );
}
