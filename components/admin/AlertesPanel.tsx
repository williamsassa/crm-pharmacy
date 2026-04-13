'use client';

import { generateWhatsAppUrl } from '@/lib/whatsapp';
import type { PatientAlerte } from '@/types';
import { motion } from 'framer-motion';

interface AlertesPanelProps {
  alertes: PatientAlerte[];
  pharmacyName?: string;
}

function getSeverity(days: number): {
  label: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
} {
  if (days > 90) {
    return {
      label: 'Critique',
      color: '#DC2626',
      bg: 'rgba(220,38,38,0.06)',
      border: 'rgba(220,38,38,0.12)',
      glow: 'rgba(220,38,38,0.08)',
    };
  }
  if (days > 60) {
    return {
      label: 'Urgent',
      color: '#EA580C',
      bg: 'rgba(234,88,12,0.06)',
      border: 'rgba(234,88,12,0.12)',
      glow: 'rgba(234,88,12,0.08)',
    };
  }
  return {
    label: 'Attention',
    color: '#D97706',
    bg: 'rgba(217,119,6,0.06)',
    border: 'rgba(217,119,6,0.12)',
    glow: 'rgba(217,119,6,0.08)',
  };
}

function getSegmentStyle(segment: string | null) {
  switch (segment) {
    case 'Chronique':
      return { color: '#2D6A4F', bg: 'rgba(45,106,79,0.1)' };
    case 'Risque':
      return { color: '#DC2626', bg: 'rgba(220,38,38,0.08)' };
    default:
      return { color: '#6C757D', bg: 'rgba(108,117,125,0.08)' };
  }
}

export default function AlertesPanel({
  alertes,
  pharmacyName = 'Pharmacie FATIMA',
}: AlertesPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-white/20 backdrop-blur-xl h-full flex flex-col"
      style={{
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.88) 100%)',
        boxShadow:
          '0 4px 24px rgba(45, 106, 79, 0.08), 0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <div
        className="px-6 pt-6 pb-4 flex items-center justify-between border-b"
        style={{ borderColor: 'rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-xl"
            style={{
              background:
                alertes.length > 0
                  ? 'rgba(220,38,38,0.08)'
                  : 'rgba(45,106,79,0.08)',
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={alertes.length > 0 ? '#DC2626' : '#2D6A4F'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1A1A2E]">
              Alertes de relance
            </h3>
            <p className="text-[10px] text-[#6C757D] font-medium mt-0.5">
              Patients inactifs
            </p>
          </div>
        </div>
        {alertes.length > 0 && (
          <div
            className="px-3 py-1.5 rounded-full text-xs font-bold"
            style={{
              background: 'rgba(220,38,38,0.08)',
              color: '#DC2626',
            }}
          >
            {alertes.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {alertes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(45,106,79,0.08)' }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2D6A4F"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#1A1A2E]">
              Tout est à jour
            </p>
            <p className="text-xs text-[#6C757D] mt-1">
              Aucun patient à relancer
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {alertes.slice(0, 5).map((alerte, index) => {
              const severity = getSeverity(alerte.jours_sans_visite);
              const segStyle = getSegmentStyle(alerte.segment_ia);

              return (
                <motion.div
                  key={alerte.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.1 + index * 0.06,
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="relative rounded-xl p-3.5 border transition-all duration-200 hover:shadow-md"
                  style={{
                    background: severity.bg,
                    borderColor: severity.border,
                  }}
                >
                  {/* Severity indicator line */}
                  <div
                    className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
                    style={{ background: severity.color }}
                  />

                  <div className="pl-2.5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-[#1A1A2E] truncate">
                            {alerte.name || 'Sans nom'}
                          </p>
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0"
                            style={{
                              background: segStyle.bg,
                              color: segStyle.color,
                            }}
                          >
                            {alerte.segment_ia}
                          </span>
                        </div>
                        <p className="text-xs text-[#6C757D] mb-1.5">
                          {alerte.phone}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                            style={{
                              background: severity.glow,
                              color: severity.color,
                            }}
                          >
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {alerte.jours_sans_visite}j
                          </span>
                          <span className="text-[10px] text-[#9CA3AF]">
                            {severity.label}
                          </span>
                        </div>
                      </div>

                      {/* WhatsApp button */}
                      <a
                        href={generateWhatsAppUrl(
                          alerte.phone,
                          alerte.name || '',
                          pharmacyName,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                        style={{
                          background:
                            'linear-gradient(135deg, #22C55E, #16A34A)',
                          boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                        }}
                        title="Relancer via WhatsApp"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="#fff"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer - voir tout link */}
      {alertes.length > 5 && (
        <div
          className="px-6 py-3 border-t"
          style={{ borderColor: 'rgba(0,0,0,0.04)' }}
        >
          <a
            href="/dashboard/admin/relances"
            className="inline-flex items-center gap-1.5 text-xs font-bold transition-colors duration-200"
            style={{ color: '#2D6A4F' }}
          >
            Voir toutes les alertes ({alertes.length})
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </a>
        </div>
      )}
    </motion.div>
  );
}
