import { useState, useRef, useEffect } from 'react';

const ELEMENTS = [
  { symbol: 'C₆H₁₂O₆', name: 'Glucose',     category: 'organic',  color: '#ffd700' },
  { symbol: 'O₂',       name: 'Oxygen',      category: 'gas',      color: '#87ceeb' },
  { symbol: 'Na⁺',      name: 'Sodium',      category: 'ion',      color: '#ff8c00' },
  { symbol: 'K⁺',       name: 'Potassium',   category: 'ion',      color: '#9370db' },
  { symbol: 'Fe',        name: 'Iron',        category: 'metal',    color: '#cd853f' },
  { symbol: 'Ca²⁺',     name: 'Calcium',     category: 'ion',      color: '#e8e8cc' },
  { symbol: 'H₂O',      name: 'Water',       category: 'compound', color: '#4169e1' },
  { symbol: 'ATP',       name: 'ATP',         category: 'organic',  color: '#39ff14' },
  { symbol: 'CO₂',      name: 'Carbon Diox', category: 'gas',      color: '#888888' },
  { symbol: 'N₂',       name: 'Nitrogen',    category: 'gas',      color: '#b0c4de' },
  { symbol: 'Mg²⁺',     name: 'Magnesium',   category: 'ion',      color: '#98fb98' },
  { symbol: 'PO₄³⁻',   name: 'Phosphate',   category: 'ion',      color: '#dda0dd' },
  { symbol: 'HCO₃⁻',   name: 'Bicarbonate', category: 'ion',      color: '#f0e68c' },
  { symbol: 'Creatine', name: 'Creatine',    category: 'organic',  color: '#ff6347' },
  { symbol: 'Caffeine', name: 'Caffeine',    category: 'organic',  color: '#cd8540' },
  { symbol: 'Lactic A', name: 'Lactic Acid', category: 'organic',  color: '#ff4500' },
];

const CAT_COLORS: Record<string, string> = {
  organic: '#ffd700', gas: '#87ceeb', ion: '#ff8c00', metal: '#cd853f', compound: '#4169e1',
};

interface Props { socket: any; }

export default function PotionCrafting({ socket }: Props) {
  const room = socket.roomState;
  const me   = room?.players.find((p: any) => p.id === socket.playerId);

  const [selected, setSelected]       = useState<string[]>([]);
  const [crafted, setCrafted]         = useState<any[]>(me?.config?.potions || []);
  const [message, setMessage]         = useState('');
  const [msgType, setMsgType]         = useState<'ok'|'err'|''>('');
  const [reacting, setReacting]       = useState(false);
  const [rxProgress, setRxProgress]   = useState(0);
  const rxIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggleEl = (sym: string) => {
    if (reacting) return;
    setSelected(prev =>
      prev.includes(sym) ? prev.filter(s => s !== sym)
        : prev.length < 2 ? [...prev, sym] : prev
    );
    setMessage('');
  };

  const handleCraft = async () => {
    if (selected.length !== 2) return;
    if (crafted.length >= 3) { setMessage('MAX 3 POTIONS'); setMsgType('err'); return; }

    setReacting(true);
    setRxProgress(0);
    rxIntervalRef.current = setInterval(() => {
      setRxProgress(p => Math.min(p + 4, 100));
    }, 60);

    await new Promise(r => setTimeout(r, 1500));
    if (rxIntervalRef.current) clearInterval(rxIntervalRef.current);
    setRxProgress(100);

    const result = await socket.craftPotion(selected);
    setReacting(false);
    setRxProgress(0);

    if (result.success && result.potion) {
      setCrafted(prev => [...prev, result.potion]);
      setMessage('CREATED: ' + result.potion.name.toUpperCase());
      setMsgType('ok');
      setSelected([]);
    } else {
      setMessage(result.error?.toUpperCase() || 'NO REACTION');
      setMsgType('err');
    }
  };

  useEffect(() => () => { if (rxIntervalRef.current) clearInterval(rxIntervalRef.current); }, []);

  const isReady = me?.isReady;

  const sel0 = ELEMENTS.find(e => e.symbol === selected[0]);
  const sel1 = ELEMENTS.find(e => e.symbol === selected[1]);

  return (
    <div className="min-h-screen px-4 py-8 max-w-5xl mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="font-pixel text-lg text-retro-yellow glow-text-gold mb-1">POTION LAB</h2>
        <p className="font-retro text-lg text-retro-cyan/60 tracking-widest">CHEMISTRY — COMBINE ELEMENTS TO BREW PERFORMANCE POTIONS</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Element grid */}
        <div className="md:col-span-2 pixel-card">
          <p className="section-title">ELEMENT TABLE</p>
          {/* Legend */}
          <div className="flex gap-3 mb-3 flex-wrap">
            {Object.entries(CAT_COLORS).map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-1">
                <div className="w-2 h-2" style={{ background: color }} />
                <span className="font-retro text-base text-retro-white/50">{cat.toUpperCase()}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            {ELEMENTS.map(el => {
              const isSel = selected.includes(el.symbol);
              return (
                <button key={el.symbol} onClick={() => toggleEl(el.symbol)}
                  className="p-1.5 border transition-all cursor-pointer text-center min-h-[54px] flex flex-col items-center justify-center"
                  style={{
                    borderColor: isSel ? el.color : '#1e1e5e',
                    background:  isSel ? `${el.color}22` : 'rgba(0,0,0,0.35)',
                    boxShadow:   isSel ? `0 0 10px ${el.color}55` : 'none',
                    transform:   isSel ? 'scale(1.08)' : 'scale(1)',
                  }}>
                  <span className="font-retro text-lg block leading-tight" style={{ color: el.color }}>
                    {el.symbol}
                  </span>
                  <span className="font-retro text-base text-retro-white/35 mt-0.5 leading-tight block">
                    {el.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4">
          {/* Reaction chamber */}
          <div className="pixel-card text-center">
            <p className="section-title text-center">REACTION CHAMBER</p>

            {/* Inputs display */}
            <div className="flex items-center justify-center gap-2 mb-4 min-h-[52px]">
              {[sel0, sel1].map((el, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i === 1 && <span className="font-pixel text-retro-yellow text-sm">+</span>}
                  {el ? (
                    <div className="px-2 py-1 border font-retro text-xl"
                      style={{ borderColor: el.color, background: `${el.color}18`, color: el.color }}>
                      {el.symbol}
                    </div>
                  ) : (
                    <div className="px-3 py-1 border border-retro-border font-retro text-lg text-retro-white/20">
                      ?
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Reaction progress */}
            {reacting && (
              <div className="mb-3">
                <div className="stat-bar mb-1">
                  <div className="stat-bar-fill transition-none" style={{ width: `${rxProgress}%`, background: '#e91e8c', boxShadow: '0 0 8px #e91e8c' }} />
                </div>
                <p className="font-retro text-lg text-retro-magenta animate-blink">REACTING...</p>
              </div>
            )}

            {message && (
              <p className={`font-retro text-lg mb-2 ${msgType === 'ok' ? 'text-retro-green' : 'text-retro-red'}`}>
                {message}
              </p>
            )}

            <button onClick={handleCraft}
              disabled={selected.length !== 2 || reacting || crafted.length >= 3}
              className={selected.length === 2 && !reacting ? 'btn-pink w-full text-[9px] py-2' : 'btn-ghost w-full text-[9px] py-2'}>
              {reacting ? 'MIXING...' : 'COMBINE'}
            </button>
          </div>

          {/* Crafted potions */}
          <div className="pixel-card flex-1">
            <div className="flex items-baseline justify-between mb-2">
              <p className="section-title">POTIONS</p>
              <p className="font-retro text-lg text-retro-white/40">{crafted.length}/3</p>
            </div>

            {crafted.length === 0 ? (
              <p className="font-retro text-base text-retro-white/30 text-center py-4">
                NO POTIONS BREWED YET
              </p>
            ) : (
              <div className="space-y-2">
                {crafted.map((p: any, i: number) => (
                  <div key={i} className="p-2 border" style={{ borderColor: p.color || '#00d4ff' }}>
                    <p className="font-retro text-lg mb-0.5" style={{ color: p.color || '#00d4ff' }}>
                      {p.name?.toUpperCase() || 'POTION'}
                    </p>
                    <p className="font-retro text-base text-retro-white/50 mb-0.5">{p.effect}</p>
                    <p className="font-retro text-base text-retro-green">
                      +{p.magnitude} {p.stat?.replace(/_/g, ' ').toUpperCase()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={async () => {
            if (crafted.length >= 3 || reacting) return;
            setReacting(true);
            setRxProgress(0);
            rxIntervalRef.current = setInterval(() => setRxProgress(p => Math.min(p + 6, 100)), 40);
            // Try random valid combinations until we get 3 potions
            const allSymbols = ELEMENTS.map(e => e.symbol);
            let attempts = 0;
            while (crafted.length < 3 && attempts < 30) {
              attempts++;
              const a = allSymbols[Math.floor(Math.random() * allSymbols.length)];
              const b = allSymbols[Math.floor(Math.random() * allSymbols.length)];
              if (a === b) continue;
              const result = await socket.craftPotion([a, b]);
              if (result.success && result.potion) {
                setCrafted(prev => [...prev, result.potion]);
                if (crafted.length + 1 >= 3) break;
              }
            }
            if (rxIntervalRef.current) clearInterval(rxIntervalRef.current);
            setReacting(false);
            setRxProgress(0);
            setMessage('RANDOM POTIONS BREWED!');
            setMsgType('ok');
          }}
            disabled={crafted.length >= 3 || reacting}
            className={crafted.length < 3 && !reacting ? 'btn-cyan w-full py-2 text-sm mb-2' : 'btn-ghost w-full py-2 text-sm mb-2'}>
            AUTO-BREW 3 RANDOM POTIONS
          </button>

          <button onClick={() => socket.setReady(true)} disabled={!!isReady}
            className={isReady ? 'btn-ghost py-3' : 'btn-green py-3'}>
            {isReady ? 'WAITING...' : 'DONE CRAFTING'}
          </button>
        </div>
      </div>
    </div>
  );
}
