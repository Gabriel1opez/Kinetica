import React, { useMemo } from 'react';

const STAR_COLORS = [
  '#e8e8ff', '#e8e8ff', '#e8e8ff', // majority white
  '#aaccff', '#aaccff',             // blue-white
  '#ffd4a0',                        // warm yellow
  '#ffaaaa',                        // warm red
  '#aaffcc',                        // green tint
];

export default function StarField() {
  const stars = useMemo(() => {
    return Array.from({ length: 120 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: i < 6 ? Math.random() * 2 + 3 : Math.random() * 2.5 + 0.5, // first 6 are "bright stars"
      duration: Math.random() * 4 + 2,
      delay: Math.random() * 5,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      bright: i < 6,
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      {/* Deep space gradient — richer with multiple color stops */}
      <div className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #020012 0%, #0a0520 20%, #140a2e 50%, #1a0e3a 70%, #2d1b4e 100%)',
        }}
      />

      {/* Stars with color variety */}
      {stars.map(star => (
        <div
          key={star.id}
          className="star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            background: star.color,
            boxShadow: star.bright
              ? `0 0 ${star.size * 3}px ${star.color}, 0 0 ${star.size * 6}px ${star.color}44`
              : `0 0 ${star.size}px ${star.color}66`,
            '--duration': `${star.duration}s`,
            '--delay': `${star.delay}s`,
          } as React.CSSProperties}
        />
      ))}

      {/* Constellation lines (subtle) */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <line x1="15%" y1="12%" x2="22%" y2="18%" stroke="#aaccff" strokeWidth="1"/>
        <line x1="22%" y1="18%" x2="28%" y2="14%" stroke="#aaccff" strokeWidth="1"/>
        <line x1="70%" y1="25%" x2="76%" y2="30%" stroke="#aaccff" strokeWidth="1"/>
        <line x1="76%" y1="30%" x2="82%" y2="28%" stroke="#aaccff" strokeWidth="1"/>
      </svg>

      {/* Nebula clouds — two layers for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-2/5 opacity-25"
        style={{
          background: 'linear-gradient(0deg, rgba(74,26,107,0.7) 0%, rgba(40,15,80,0.3) 50%, transparent 100%)',
        }}
      />
      <div className="absolute top-0 right-0 w-1/3 h-1/3 opacity-10"
        style={{
          background: 'radial-gradient(ellipse at 70% 30%, rgba(100,50,150,0.5) 0%, transparent 70%)',
        }}
      />
      {/* Subtle blue nebula */}
      <div className="absolute bottom-1/4 left-0 w-2/5 h-1/4 opacity-8"
        style={{
          background: 'radial-gradient(ellipse at 30% 70%, rgba(0,100,180,0.3) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
