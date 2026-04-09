'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export default function Card({ children, className, hover = false, padding = 'md' }: CardProps) {
  const paddings = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={hover ? { y: -2, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' } : undefined}
      className={cn(
        'bg-white rounded-standard shadow-card border border-gray-100',
        paddings[padding],
        className
      )}
    >
      {children}
    </motion.div>
  );
}
