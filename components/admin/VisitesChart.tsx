'use client';

import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { VisiteChartData } from '@/types';

interface VisitesChartProps {
  data: VisiteChartData[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-4 py-3 rounded-xl border border-white/30 backdrop-blur-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(248,249,250,0.95) 100%)',
          boxShadow: '0 8px 32px rgba(45, 106, 79, 0.12), 0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <p className="text-xs font-semibold text-[#6C757D] mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)' }} />
          <p className="text-sm font-bold" style={{ color: '#2D6A4F' }}>
            {payload[0].value} visite{payload[0].value > 1 ? 's' : ''}
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export default function VisitesChart({ data }: VisitesChartProps) {
  const totalVisites = data.reduce((sum, d) => sum + d.visites, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-white/20 backdrop-blur-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.88) 100%)',
        boxShadow: '0 4px 24px rgba(45, 106, 79, 0.08), 0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#1A1A2E]">Visites</h3>
          <p className="text-xs text-[#6C757D] mt-0.5">7 derniers jours</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-extrabold" style={{ color: '#2D6A4F' }}>{totalVisites}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6C757D]">Total</p>
          </div>
          <div
            className="p-2.5 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(45, 106, 79, 0.1) 0%, rgba(82, 183, 136, 0.15) 100%)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 pb-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="visitesGradientFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#52B788" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#40916C" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#2D6A4F" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="visitesStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2D6A4F" />
                <stop offset="50%" stopColor="#40916C" />
                <stop offset="100%" stopColor="#52B788" />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="rgba(45, 106, 79, 0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6C757D', fontSize: 11, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              tick={{ fill: '#6C757D', fontSize: 11, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              dx={-4}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(45, 106, 79, 0.15)', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="visites"
              stroke="url(#visitesStroke)"
              strokeWidth={2.5}
              fill="url(#visitesGradientFill)"
              dot={{
                fill: '#ffffff',
                stroke: '#2D6A4F',
                strokeWidth: 2.5,
                r: 4.5,
              }}
              activeDot={{
                r: 7,
                fill: '#2D6A4F',
                stroke: '#ffffff',
                strokeWidth: 3,
                style: { filter: 'drop-shadow(0 2px 6px rgba(45, 106, 79, 0.4))' },
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
