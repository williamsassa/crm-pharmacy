'use client';

import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

interface SuccessAnimationProps {
  patientName?: string;
  duration?: number;
}

function SuccessParticle({ index, total }: { index: number; total: number }) {
  const angle = (index / total) * 360;
  const distance = 60 + Math.random() * 50;
  const size = 4 + Math.random() * 6;
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * distance;
  const y = Math.sin(rad) * distance;

  return (
    <motion.div
      initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
      animate={{ x, y, scale: 0, opacity: 0 }}
      transition={{
        duration: 0.8 + Math.random() * 0.4,
        delay: 0.2 + Math.random() * 0.15,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        background:
          index % 3 === 0 ? '#52B788' : index % 3 === 1 ? '#2D6A4F' : '#40916C',
        left: '50%',
        top: '50%',
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
    />
  );
}

function CountdownBar({ duration }: { duration: number }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [duration]);

  return (
    <div className="w-full max-w-[200px] h-1.5 bg-pharma-green/10 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-pharma-green to-pharma-green-light"
        style={{ width: `${progress}%` }}
        transition={{ ease: 'linear' }}
      />
    </div>
  );
}

export default function SuccessAnimation({
  patientName,
  duration = 2500,
}: SuccessAnimationProps) {
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(duration / 1000));
  const particles = useMemo(() => Array.from({ length: 16 }, (_, i) => i), []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16"
    >
      {/* Main circle with particles */}
      <div className="relative mb-8">
        {/* Pulsing rings */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
          className="absolute inset-0 rounded-full border-2 border-pharma-green-light"
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
          className="absolute inset-0 rounded-full border-2 border-pharma-green/40"
        />

        {/* Particle explosion */}
        <div className="absolute inset-0 flex items-center justify-center">
          {particles.map((i) => (
            <SuccessParticle key={i} index={i} total={particles.length} />
          ))}
        </div>

        {/* Main checkmark circle */}
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 250,
            damping: 18,
            delay: 0.05,
          }}
          className="relative w-28 h-28 rounded-full flex items-center justify-center shadow-xl"
          style={{
            background:
              'linear-gradient(135deg, #2D6A4F 0%, #40916C 50%, #52B788 100%)',
            boxShadow: '0 10px 40px rgba(45, 106, 79, 0.3)',
          }}
        >
          {/* Inner glow */}
          <div className="absolute inset-1 rounded-full bg-white/10" />

          {/* Checkmark */}
          <motion.svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path
              d="M20 6L9 17l-5-5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                delay: 0.35,
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          </motion.svg>
        </motion.div>
      </div>

      {/* Success text */}
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.35 }}
        className="text-2xl font-bold text-pharma-green mb-1"
      >
        Enregistrement reussi
      </motion.p>

      {/* Patient name */}
      {patientName && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.3 }}
          className="text-base text-pharma-text-secondary mb-6"
        >
          <span className="font-medium text-pharma-green-medium">
            {patientName}
          </span>{' '}
          a ete enregistré
        </motion.p>
      )}

      {/* Countdown section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col items-center gap-3"
      >
        <CountdownBar duration={duration} />
        <p className="text-xs text-pharma-text-secondary/60">
          Retour dans {secondsLeft}s
        </p>
      </motion.div>
    </motion.div>
  );
}
