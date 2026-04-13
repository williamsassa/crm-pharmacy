'use client';

import Sidebar from '@/components/layout/Sidebar';
import Spinner from '@/components/ui/Spinner';
import { useRequireAuth } from '@/hooks/useAuth';
import { createSupabaseClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { generateWhatsAppUrl } from '@/lib/whatsapp';
import type { PatientAlerte } from '@/types';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';

const ThreeBackground = dynamic(
  () => import('@/components/layout/ThreeBackground'),
  {
    ssr: false,
  },
);

function getSeverity(days: number) {
  if (days > 90) {
    return {
      label: 'Critique',
      color: '#DC2626',
      bg: 'rgba(220,38,38,0.06)',
      border: 'rgba(220,38,38,0.12)',
      ring: 'rgba(220,38,38,0.15)',
    };
  }
  if (days > 60) {
    return {
      label: 'Urgent',
      color: '#EA580C',
      bg: 'rgba(234,88,12,0.06)',
      border: 'rgba(234,88,12,0.12)',
      ring: 'rgba(234,88,12,0.15)',
    };
  }
  return {
    label: 'Attention',
    color: '#D97706',
    bg: 'rgba(217,119,6,0.06)',
    border: 'rgba(217,119,6,0.12)',
    ring: 'rgba(217,119,6,0.15)',
  };
}

function getSegmentStyle(segment: string | null) {
  switch (segment) {
    case 'Chronique':
      return {
        color: '#2D6A4F',
        bg: 'rgba(45,106,79,0.1)',
        border: 'rgba(45,106,79,0.2)',
      };
    case 'Risque':
      return {
        color: '#DC2626',
        bg: 'rgba(220,38,38,0.08)',
        border: 'rgba(220,38,38,0.15)',
      };
    case 'Suivi régulier':
      return {
        color: '#2563EB',
        bg: 'rgba(37,99,235,0.08)',
        border: 'rgba(37,99,235,0.15)',
      };
    default:
      return {
        color: '#6C757D',
        bg: 'rgba(108,117,125,0.08)',
        border: 'rgba(108,117,125,0.15)',
      };
  }
}

function getInitials(name: string | null) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarGradient(name: string | null) {
  const gradients = [
    'linear-gradient(135deg, #2D6A4F, #52B788)',
    'linear-gradient(135deg, #40916C, #74C69D)',
    'linear-gradient(135deg, #1B4F72, #2E86C1)',
    'linear-gradient(135deg, #52B788, #95D5B2)',
  ];
  if (!name) return gradients[0];
  return gradients[name.charCodeAt(0) % gradients.length];
}

export default function RelancesPage() {
  const { profile, loading } = useRequireAuth(['admin', 'superadmin']);
  const [alertes, setAlertes] = useState<PatientAlerte[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const supabase = useMemo(() => createSupabaseClient(), []);

  const loadData = useCallback(async () => {
    try {
      const { data: risquePatients } = await supabase
        .from('patients')
        .select('*')
        .in('segment_ia', ['Chronique', 'Risque', 'Suivi régulier']);

      const alertList: PatientAlerte[] = [];
      if (risquePatients) {
        for (const p of risquePatients) {
          const { data: lastVisite } = await supabase
            .from('visites')
            .select('date')
            .eq('patient_id', p.id)
            .order('date', { ascending: false })
            .limit(1)
            .single();

          if (lastVisite) {
            const daysSince = Math.floor(
              (Date.now() - new Date(lastVisite.date).getTime()) /
                (1000 * 60 * 60 * 24),
            );
            if (daysSince > 30) {
              alertList.push({
                id: p.id,
                name: p.name,
                phone: p.phone,
                segment_ia: p.segment_ia,
                derniere_visite: lastVisite.date,
                jours_sans_visite: daysSince,
              });
            }
          }
        }
      }
      alertList.sort((a, b) => b.jours_sans_visite - a.jours_sans_visite);
      setAlertes(alertList);
    } catch (error) {
      console.error('Erreur chargement relances:', error);
      setDataError(
        'Les tables de données ne sont pas encore disponibles. Veuillez configurer la base de données Supabase.',
      );
    } finally {
      setDataLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (profile) loadData();
  }, [profile, loadData]);

  if (loading || !profile || dataLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            'linear-gradient(135deg, #F8F9FA 0%, #EDF5F0 50%, #F0FAF4 100%)',
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm font-medium text-[#6C757D]">
            Chargement des relances...
          </p>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div
        className="min-h-screen"
        style={{
          background:
            'linear-gradient(135deg, #F8F9FA 0%, #EDF5F0 40%, #F0FAF4 70%, #F8F9FA 100%)',
        }}
      >
        <Sidebar profile={profile} />
        <main className="lg:ml-[272px] p-6 lg:p-8">
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-8 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(234,88,12,0.1)' }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#EA580C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">
              Données non disponibles
            </h2>
            <p className="text-sm text-[#6C757D] max-w-md mx-auto">
              {dataError}
            </p>
            <button
              onClick={() => {
                setDataError(null);
                setDataLoading(true);
                loadData();
              }}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, #2D6A4F, #52B788)',
              }}
            >
              Reessayer
            </button>
          </div>
        </main>
      </div>
    );
  }

  const pharmacyName = profile.pharmacy_name || 'Pharmacie FATIMA';

  // Severity summary
  const criticalCount = alertes.filter((a) => a.jours_sans_visite > 90).length;
  const urgentCount = alertes.filter(
    (a) => a.jours_sans_visite > 60 && a.jours_sans_visite <= 90,
  ).length;
  const warningCount = alertes.filter((a) => a.jours_sans_visite <= 60).length;

  return (
    <div
      className="min-h-screen relative"
      style={{
        background:
          'linear-gradient(135deg, #F8F9FA 0%, #EDF5F0 40%, #F0FAF4 70%, #F8F9FA 100%)',
      }}
    >
      <div className="opacity-15">
        <ThreeBackground />
      </div>
      <Sidebar profile={profile} />
      <main className="lg:ml-[272px] p-6 lg:p-8 relative z-10">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-[#1A1A2E] tracking-tight">
                Relances
              </h1>
              <p className="text-sm text-[#6C757D] mt-1">
                Patients à relancer ({'>'}30 jours sans visite)
              </p>
            </div>
            {alertes.length > 0 && (
              <div className="hidden md:flex items-center gap-2">
                {criticalCount > 0 && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border"
                    style={{
                      background: 'rgba(220,38,38,0.06)',
                      color: '#DC2626',
                      borderColor: 'rgba(220,38,38,0.12)',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    {criticalCount} critique{criticalCount > 1 ? 's' : ''}
                  </div>
                )}
                {urgentCount > 0 && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border"
                    style={{
                      background: 'rgba(234,88,12,0.06)',
                      color: '#EA580C',
                      borderColor: 'rgba(234,88,12,0.12)',
                    }}
                  >
                    {urgentCount} urgent{urgentCount > 1 ? 's' : ''}
                  </div>
                )}
                {warningCount > 0 && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border"
                    style={{
                      background: 'rgba(217,119,6,0.06)',
                      color: '#D97706',
                      borderColor: 'rgba(217,119,6,0.12)',
                    }}
                  >
                    {warningCount} attention
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {alertes.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl border border-white/20 backdrop-blur-xl"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.88) 100%)',
              boxShadow:
                '0 4px 24px rgba(45, 106, 79, 0.08), 0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <div className="text-center py-20 px-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(45,106,79,0.08) 0%, rgba(82,183,136,0.12) 100%)',
                }}
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2D6A4F"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </motion.div>
              <h2 className="text-xl font-extrabold text-[#1A1A2E] mb-2">
                Tout est à jour
              </h2>
              <p className="text-sm text-[#6C757D] max-w-sm mx-auto">
                Aucun patient ne nécessite de relance pour le moment. Tous les
                patients sont suivis régulièrement.
              </p>
            </div>
          </motion.div>
        ) : (
          /* Patient Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alertes.map((alerte, index) => {
              const severity = getSeverity(alerte.jours_sans_visite);
              const segStyle = getSegmentStyle(alerte.segment_ia);

              return (
                <motion.div
                  key={alerte.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.04,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  className="relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-shadow duration-300 hover:shadow-lg"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.88) 100%)',
                    borderColor: severity.border,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Severity indicator */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                    style={{ background: severity.color }}
                  />

                  <div className="p-5 pl-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{
                          background: getAvatarGradient(alerte.name),
                          boxShadow: '0 3px 10px rgba(45, 106, 79, 0.2)',
                        }}
                      >
                        {getInitials(alerte.name)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="text-base font-bold text-[#1A1A2E] truncate">
                            {alerte.name || 'Sans nom'}
                          </h3>
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0 border"
                            style={{
                              background: segStyle.bg,
                              color: segStyle.color,
                              borderColor: segStyle.border,
                            }}
                          >
                            <span
                              className="w-1 h-1 rounded-full"
                              style={{ background: segStyle.color }}
                            />
                            {alerte.segment_ia}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-[#6C757D]">
                          <span className="font-medium">{alerte.phone}</span>
                          <span>
                            Derniere visite:{' '}
                            {formatDate(alerte.derniere_visite)}
                          </span>
                        </div>

                        {/* Days counter and actions */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            {/* Days badge - prominent */}
                            <div
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold border"
                              style={{
                                background: severity.bg,
                                color: severity.color,
                                borderColor: severity.border,
                              }}
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              {alerte.jours_sans_visite} jours
                            </div>
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider"
                              style={{ color: severity.color }}
                            >
                              {severity.label}
                            </span>
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
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
                            style={{
                              background:
                                'linear-gradient(135deg, #22C55E, #16A34A)',
                              boxShadow: '0 3px 12px rgba(34, 197, 94, 0.3)',
                            }}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Relancer
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
