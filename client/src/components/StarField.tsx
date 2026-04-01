import React, { useMemo } from 'react';

export default function StarField() {
  const stars = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 4 + 2,
      delay: Math.random() * 4,
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      {/* Deep space gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0520] via-[#1a0a2e] to-[#2d1b4e]" />

      {/* Stars */}
      {stars.map(star => (
        <div
          key={star.id}
          className="star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            '--duration': `${star.duration}s`,
            '--delay': `${star.delay}s`,
          } as React.CSSProperties}
        />
      ))}

      {/* Purple nebula clouds */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 opacity-30"
        style={{
          background: 'linear-gradient(0deg, rgba(74,26,107,0.6) 0%, transparent 100%)',
        }}
      />
    </div>
  );
}
