'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRequireAuth } from '@/hooks/useAuth';
import { createSupabaseClient } from '@/lib/supabase/client';
import PatientForm from '@/components/comptoir/PatientForm';
import TopBar from '@/components/layout/TopBar';
import Spinner from '@/components/ui/Spinner';

function PharmaCross({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="14" y="4" width="12" height="32" rx="3" fill="currentColor" />
      <rect x="4" y="14" width="32" height="12" rx="3" fill="currentColor" />
    </svg>
  );
}

function Pharma3DBackground() {
  // Pill capsules (6 items)
  const pills = [
    { id: 'pill-0', left: 5, delay: 0, duration: 22, size: 38, rotSpeed: 12 },
    { id: 'pill-1', left: 18, delay: 3, duration: 26, size: 30, rotSpeed: 15 },
    { id: 'pill-2', left: 42, delay: 7, duration: 20, size: 34, rotSpeed: 10 },
    { id: 'pill-3', left: 65, delay: 1, duration: 28, size: 28, rotSpeed: 18 },
    { id: 'pill-4', left: 80, delay: 5, duration: 24, size: 36, rotSpeed: 14 },
    { id: 'pill-5', left: 92, delay: 9, duration: 21, size: 32, rotSpeed: 16 },
  ];

  // Molecule hexagons (4 items)
  const molecules = [
    { id: 'mol-0', left: 10, delay: 2, duration: 30, size: 50, rotSpeed: 20 },
    { id: 'mol-1', left: 35, delay: 6, duration: 25, size: 40, rotSpeed: 25 },
    { id: 'mol-2', left: 58, delay: 0, duration: 32, size: 45, rotSpeed: 22 },
    { id: 'mol-3', left: 85, delay: 8, duration: 27, size: 38, rotSpeed: 18 },
  ];

  // Pharmacy crosses (3 items)
  const crosses = [
    { id: 'cross-0', left: 22, delay: 4, duration: 26, size: 28, rotSpeed: 14 },
    { id: 'cross-1', left: 55, delay: 10, duration: 22, size: 24, rotSpeed: 16 },
    { id: 'cross-2', left: 75, delay: 1, duration: 30, size: 32, rotSpeed: 12 },
  ];

  // DNA helix dots (2 strands)
  const dnaStrands = [
    { id: 'dna-0', left: 48, delay: 0, duration: 35, size: 60 },
    { id: 'dna-1', left: 90, delay: 5, duration: 38, size: 55 },
  ];

  // Bubbles (5 items)
  const bubbles = [
    { id: 'bub-0', left: 8, delay: 1, duration: 18, size: 10 },
    { id: 'bub-1', left: 28, delay: 5, duration: 15, size: 8 },
    { id: 'bub-2', left: 50, delay: 3, duration: 20, size: 12 },
    { id: 'bub-3', left: 70, delay: 8, duration: 16, size: 6 },
    { id: 'bub-4', left: 95, delay: 2, duration: 19, size: 9 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: '1200px' }}>
      <style jsx>{`
        @keyframes pharma-float {
          0% {
            transform: translateY(0) translateZ(0);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-110vh) translateZ(40px);
            opacity: 0;
          }
        }

        @keyframes pharma-spin-1 {
          0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
          100% { transform: rotateX(360deg) rotateY(180deg) rotateZ(90deg); }
        }

        @keyframes pharma-spin-2 {
          0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
          100% { transform: rotateX(-180deg) rotateY(360deg) rotateZ(-120deg); }
        }

        @keyframes pharma-spin-3 {
          0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
          100% { transform: rotateX(120deg) rotateY(-360deg) rotateZ(180deg); }
        }

        @keyframes pharma-sway {
          0%, 100% { transform: translateX(0px); }
          25% { transform: translateX(15px); }
          75% { transform: translateX(-15px); }
        }

        @keyframes dna-helix-a {
          0% { transform: translateX(0px) rotateY(0deg); }
          25% { transform: translateX(12px) rotateY(90deg); }
          50% { transform: translateX(0px) rotateY(180deg); }
          75% { transform: translateX(-12px) rotateY(270deg); }
          100% { transform: translateX(0px) rotateY(360deg); }
        }

        @keyframes dna-helix-b {
          0% { transform: translateX(0px) rotateY(180deg); }
          25% { transform: translateX(-12px) rotateY(270deg); }
          50% { transform: translateX(0px) rotateY(360deg); }
          75% { transform: translateX(12px) rotateY(450deg); }
          100% { transform: translateX(0px) rotateY(540deg); }
        }

        @keyframes bubble-wobble {
          0%, 100% { transform: scale(1) rotateZ(0deg); }
          25% { transform: scale(1.1) rotateZ(5deg); }
          50% { transform: scale(0.95) rotateZ(-3deg); }
          75% { transform: scale(1.05) rotateZ(2deg); }
        }

        .pharma-element {
          position: absolute;
          bottom: -80px;
          will-change: transform, opacity;
        }

        .pharma-element-inner {
          transform-style: preserve-3d;
        }
      `}</style>

      {/* Pill Capsules */}
      {pills.map((p) => (
        <div
          key={p.id}
          className="pharma-element"
          style={{
            left: `${p.left}%`,
            animation: `pharma-float ${p.duration}s linear ${p.delay}s infinite, pharma-sway ${p.duration * 0.6}s ease-in-out ${p.delay}s infinite`,
          }}
        >
          <div
            className="pharma-element-inner"
            style={{
              animation: `pharma-spin-1 ${p.rotSpeed}s linear infinite`,
              opacity: 0.08 + (p.size % 5) * 0.015,
            }}
          >
            <svg width={p.size} height={p.size * 0.55} viewBox="0 0 60 33" fill="none">
              <rect x="1" y="1" width="58" height="31" rx="15.5" stroke="#2D6A4F" strokeWidth="1.5" fill="none" />
              <rect x="1" y="1" width="29" height="31" rx="15.5" fill="#52B788" />
              <rect x="30" y="1" width="29" height="31" rx="15.5" fill="#40916C" />
              <line x1="30" y1="1" x2="30" y2="32" stroke="#2D6A4F" strokeWidth="0.8" />
            </svg>
          </div>
        </div>
      ))}

      {/* Molecule Hexagons */}
      {molecules.map((m) => (
        <div
          key={m.id}
          className="pharma-element"
          style={{
            left: `${m.left}%`,
            animation: `pharma-float ${m.duration}s linear ${m.delay}s infinite, pharma-sway ${m.duration * 0.5}s ease-in-out ${m.delay}s infinite`,
          }}
        >
          <div
            className="pharma-element-inner"
            style={{
              animation: `pharma-spin-2 ${m.rotSpeed}s linear infinite`,
              opacity: 0.07 + (m.size % 4) * 0.02,
            }}
          >
            <svg width={m.size} height={m.size} viewBox="0 0 60 60" fill="none">
              {/* Central hexagon */}
              <polygon
                points="30,5 52,17 52,42 30,55 8,42 8,17"
                stroke="#2D6A4F"
                strokeWidth="1.2"
                fill="none"
              />
              {/* Inner connections */}
              <line x1="30" y1="5" x2="30" y2="55" stroke="#52B788" strokeWidth="0.6" />
              <line x1="8" y1="17" x2="52" y2="42" stroke="#52B788" strokeWidth="0.6" />
              <line x1="52" y1="17" x2="8" y2="42" stroke="#52B788" strokeWidth="0.6" />
              {/* Vertex dots */}
              <circle cx="30" cy="5" r="2.5" fill="#40916C" />
              <circle cx="52" cy="17" r="2.5" fill="#40916C" />
              <circle cx="52" cy="42" r="2.5" fill="#40916C" />
              <circle cx="30" cy="55" r="2.5" fill="#40916C" />
              <circle cx="8" cy="42" r="2.5" fill="#40916C" />
              <circle cx="8" cy="17" r="2.5" fill="#40916C" />
              <circle cx="30" cy="30" r="3" fill="#2D6A4F" />
              {/* Branch lines */}
              <line x1="30" y1="5" x2="30" y2="-5" stroke="#40916C" strokeWidth="0.8" />
              <line x1="52" y1="17" x2="60" y2="12" stroke="#40916C" strokeWidth="0.8" />
              <line x1="8" y1="42" x2="0" y2="48" stroke="#40916C" strokeWidth="0.8" />
              <circle cx="30" cy="-5" r="1.8" fill="#52B788" />
              <circle cx="60" cy="12" r="1.8" fill="#52B788" />
              <circle cx="0" cy="48" r="1.8" fill="#52B788" />
            </svg>
          </div>
        </div>
      ))}

      {/* Pharmacy Crosses */}
      {crosses.map((c) => (
        <div
          key={c.id}
          className="pharma-element"
          style={{
            left: `${c.left}%`,
            animation: `pharma-float ${c.duration}s linear ${c.delay}s infinite, pharma-sway ${c.duration * 0.7}s ease-in-out ${c.delay}s infinite`,
          }}
        >
          <div
            className="pharma-element-inner"
            style={{
              animation: `pharma-spin-3 ${c.rotSpeed}s linear infinite`,
              opacity: 0.06 + (c.size % 3) * 0.02,
            }}
          >
            <svg width={c.size} height={c.size} viewBox="0 0 40 40" fill="none">
              <rect x="14" y="2" width="12" height="36" rx="3" fill="#52B788" />
              <rect x="2" y="14" width="36" height="12" rx="3" fill="#52B788" />
              <rect x="15" y="3" width="10" height="34" rx="2.5" fill="#40916C" />
              <rect x="3" y="15" width="34" height="10" rx="2.5" fill="#40916C" />
            </svg>
          </div>
        </div>
      ))}

      {/* DNA Helix Strands */}
      {dnaStrands.map((d) => (
        <div
          key={d.id}
          className="pharma-element"
          style={{
            left: `${d.left}%`,
            animation: `pharma-float ${d.duration}s linear ${d.delay}s infinite`,
            opacity: 0.08,
          }}
        >
          <svg width={d.size * 0.5} height={d.size * 2} viewBox="0 0 30 120" fill="none">
            {/* DNA dots - strand A */}
            {Array.from({ length: 8 }, (_, i) => (
              <circle
                key={`a-${i}`}
                cx="15"
                cy={8 + i * 14}
                r="2.5"
                fill="#2D6A4F"
                style={{
                  animation: `dna-helix-a 3s linear ${i * 0.35}s infinite`,
                }}
              />
            ))}
            {/* DNA dots - strand B */}
            {Array.from({ length: 8 }, (_, i) => (
              <circle
                key={`b-${i}`}
                cx="15"
                cy={8 + i * 14}
                r="2.5"
                fill="#52B788"
                style={{
                  animation: `dna-helix-b 3s linear ${i * 0.35}s infinite`,
                }}
              />
            ))}
            {/* Connecting rungs */}
            {Array.from({ length: 8 }, (_, i) => (
              <line
                key={`r-${i}`}
                x1="3"
                y1={8 + i * 14}
                x2="27"
                y2={8 + i * 14}
                stroke="#40916C"
                strokeWidth="0.6"
                opacity="0.5"
              />
            ))}
          </svg>
        </div>
      ))}

      {/* Floating Bubbles */}
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="pharma-element"
          style={{
            left: `${b.left}%`,
            animation: `pharma-float ${b.duration}s linear ${b.delay}s infinite, pharma-sway ${b.duration * 0.4}s ease-in-out ${b.delay}s infinite`,
          }}
        >
          <div
            style={{
              animation: `bubble-wobble ${3 + (b.size % 3)}s ease-in-out infinite`,
              opacity: 0.1 + (b.size % 4) * 0.012,
            }}
          >
            <svg width={b.size} height={b.size} viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="#52B788" strokeWidth="1" fill="none" />
              <circle cx="10" cy="10" r="6" stroke="#40916C" strokeWidth="0.5" fill="none" opacity="0.5" />
              <circle cx="7" cy="7" r="2" fill="#2D6A4F" opacity="0.3" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="font-mono text-sm text-pharma-green-medium tracking-wider"
    >
      {time}
    </motion.div>
  );
}

function AnimatedCounter({ value }: { value: number }) {
  const digits = String(value).padStart(2, '0').split('');

  return (
    <div className="flex items-center gap-0.5">
      <AnimatePresence mode="popLayout">
        {digits.map((digit, i) => (
          <motion.span
            key={`${i}-${digit}`}
            initial={{ y: 20, opacity: 0, rotateX: -90 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            exit={{ y: -20, opacity: 0, rotateX: 90 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
              delay: i * 0.05,
            }}
            className="inline-block text-4xl font-bold text-pharma-green tabular-nums"
            style={{ perspective: 100 }}
          >
            {digit}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function ComptoirPage() {
  const { profile, loading, token } = useRequireAuth();
  const [todayCount, setTodayCount] = useState(0);
  const supabase = createSupabaseClient();

  const loadTodayCount = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('visites')
      .select('*', { count: 'exact', head: true })
      .gte('date', `${today}T00:00:00`);
    setTodayCount(count || 0);
  }, [supabase]);

  useEffect(() => {
    if (profile) loadTodayCount();
  }, [profile, loadTodayCount]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen comptoir-bg flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-pharma-green-light/20 animate-ping" />
            <Spinner size="lg" />
          </div>
          <p className="text-sm text-pharma-text-secondary">Chargement du comptoir...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen comptoir-bg relative overflow-hidden">
      {/* 3D Pharmacy animated background */}
      <Pharma3DBackground />

      {/* Subtle decorative gradient orbs */}
      <div className="absolute top-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-pharma-green-light/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-150px] left-[-100px] w-[400px] h-[400px] rounded-full bg-pharma-green/5 blur-3xl pointer-events-none" />

      <TopBar profile={profile} title="Comptoir" />

      <div
        className="flex flex-col items-center justify-center px-4 relative z-10"
        style={{ minHeight: 'calc(100vh - 64px)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Header: Cross + Title + Clock */}
          <div className="text-center mb-8">
            {/* Pharma cross */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-pharma-green to-pharma-green-light mb-4 shadow-lg shadow-pharma-green/20"
            >
              <PharmaCross className="w-7 h-7 text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-semibold text-pharma-text"
            >
              Enregistrement patient
            </motion.h2>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="flex items-center justify-center gap-2 mt-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-pharma-green-light animate-pulse" />
              <LiveClock />
            </motion.div>
          </div>

          {/* Glassmorphism Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card-strong rounded-2xl p-6 animate-pulse-glow"
          >
            <PatientForm onSuccess={() => setTodayCount((c) => c + 1)} />
          </motion.div>

          {/* Counter Section */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex justify-center"
          >
            <div className="glass-card rounded-2xl px-8 py-4 flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-xs font-medium text-pharma-text-secondary uppercase tracking-wider">
                  Aujourd&apos;hui
                </span>
                <span className="text-xs text-pharma-text-secondary/60">patients</span>
              </div>
              <div className="w-px h-8 bg-pharma-green/10" />
              <AnimatedCounter value={todayCount} />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
