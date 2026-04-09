'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  color?: string;
  index?: number;
}

function useCountUp(end: number, duration: number = 1200) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [end, duration]);

  return count;
}

export default function KPICard({ title, value, subtitle, icon, trend, index = 0 }: KPICardProps) {
  const isNumeric = typeof value === 'number';
  const isPercentString = typeof value === 'string' && value.endsWith('%');
  const numericValue = isNumeric
    ? value
    : isPercentString
    ? parseInt(value.replace('%', ''), 10)
    : 0;
  const animatedValue = useCountUp(numericValue, 1400);

  const displayValue = isNumeric
    ? animatedValue
    : isPercentString
    ? `${animatedValue}%`
    : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group relative overflow-hidden rounded-2xl border border-white/20 backdrop-blur-xl cursor-default"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
        boxShadow: '0 4px 24px rgba(45, 106, 79, 0.08), 0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Subtle gradient overlay on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(45, 106, 79, 0.03) 0%, rgba(82, 183, 136, 0.06) 100%)',
        }}
      />

      {/* Decorative corner glow */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(82, 183, 136, 0.5) 0%, transparent 70%)',
        }}
      />

      <div className="relative p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6C757D] mb-2">
              {title}
            </p>
            <motion.p
              key={displayValue}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
              className="text-3xl font-extrabold tracking-tight"
              style={{ color: '#2D6A4F' }}
            >
              {displayValue}
            </motion.p>

            {subtitle && (
              <p className="text-xs text-[#6C757D] mt-1.5">{subtitle}</p>
            )}

            {trend && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                className={`inline-flex items-center gap-1 mt-3 px-2.5 py-1 rounded-full text-xs font-bold ${
                  trend.positive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={trend.positive ? '' : 'rotate-180'}
                >
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                {Math.abs(trend.value)}%
              </motion.div>
            )}
          </div>

          {/* Icon container with glow */}
          <div
            className="relative flex-shrink-0 p-3.5 rounded-xl transition-all duration-300 group-hover:scale-110"
            style={{
              background: 'linear-gradient(135deg, #2D6A4F 0%, #40916C 50%, #52B788 100%)',
              boxShadow: '0 4px 14px rgba(45, 106, 79, 0.3), 0 0 20px rgba(82, 183, 136, 0.15)',
            }}
          >
            <div className="text-white">{icon}</div>
            {/* Pulse ring animation */}
            <div
              className="absolute inset-0 rounded-xl animate-ping opacity-0 group-hover:opacity-20 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)' }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
