'use client';

import { useMemo } from 'react';

interface FloatingElement {
  id: number;
  type: 'capsule' | 'circle' | 'cross' | 'ring';
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
  opacity: number;
}

export default function ThreeBackground() {
  const elements = useMemo<FloatingElement[]>(() => {
    const colors = ['#2D6A4F', '#52B788', '#40916C', '#74C69D', '#1B4F72'];
    const items: FloatingElement[] = [];
    for (let i = 0; i < 14; i++) {
      items.push({
        id: i,
        type: (['capsule', 'circle', 'cross', 'ring'] as const)[i % 4],
        x: (i * 17 + 5) % 95,
        y: (i * 23 + 10) % 90,
        size: 12 + (i % 5) * 6,
        delay: i * 0.7,
        duration: 8 + (i % 4) * 3,
        color: colors[i % colors.length],
        opacity: 0.08 + (i % 3) * 0.04,
      });
    }
    return items;
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
      {elements.map((el) => (
        <div
          key={el.id}
          className="absolute animate-float-pharma"
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            animationDelay: `${el.delay}s`,
            animationDuration: `${el.duration}s`,
          }}
        >
          {el.type === 'capsule' && (
            <div
              style={{
                width: el.size * 0.6,
                height: el.size * 1.4,
                borderRadius: el.size,
                background: el.color,
                opacity: el.opacity,
              }}
            />
          )}
          {el.type === 'circle' && (
            <div
              style={{
                width: el.size,
                height: el.size,
                borderRadius: '50%',
                background: el.color,
                opacity: el.opacity,
              }}
            />
          )}
          {el.type === 'cross' && (
            <svg width={el.size} height={el.size} viewBox="0 0 24 24" style={{ opacity: el.opacity }}>
              <path d="M12 2v20M2 12h20" stroke={el.color} strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
          )}
          {el.type === 'ring' && (
            <div
              style={{
                width: el.size,
                height: el.size,
                borderRadius: '50%',
                border: `2px solid ${el.color}`,
                opacity: el.opacity,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
