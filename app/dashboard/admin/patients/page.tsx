'use client';

import PatientsTable from '@/components/admin/PatientsTable';
import Sidebar from '@/components/layout/Sidebar';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import { useRequireAuth } from '@/hooks/useAuth';
import { createSupabaseClient } from '@/lib/supabase/client';
import { formatDate, formatDateTime } from '@/lib/utils';
import { generateWhatsAppUrl } from '@/lib/whatsapp';
import type { Patient, Visite } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';

const ThreeBackground = dynamic(
  () => import('@/components/layout/ThreeBackground'),
  {
    ssr: false,
  },
);

function getSegmentStyle(segment: string | null) {
  switch (segment) {
    case 'Chronique':
      return {
        color: '#2D6A4F',
        bg: 'rgba(45,106,79,0.1)',
        border: 'rgba(45,106,79,0.2)',
        label: 'Chronique',
      };
    case 'Risque':
      return {
        color: '#DC2626',
        bg: 'rgba(220,38,38,0.08)',
        border: 'rgba(220,38,38,0.15)',
        label: 'Risque',
      };
    case 'Suivi régulier':
      return {
        color: '#2563EB',
        bg: 'rgba(37,99,235,0.08)',
        border: 'rgba(37,99,235,0.15)',
        label: 'Suivi régulier',
      };
    case 'Occasionnel':
      return {
        color: '#6C757D',
        bg: 'rgba(108,117,125,0.08)',
        border: 'rgba(108,117,125,0.15)',
        label: 'Occasionnel',
      };
    default:
      return {
        color: '#9CA3AF',
        bg: 'rgba(108,117,125,0.06)',
        border: 'rgba(108,117,125,0.1)',
        label: 'Non classe',
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

export default function PatientsPage() {
  const { profile, loading } = useRequireAuth(['admin', 'superadmin']);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientVisites, setPatientVisites] = useState<Visite[]>([]);

  const supabase = useMemo(() => createSupabaseClient(), []);

  const loadData = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setPatients(data);
    } catch (error) {
      console.error('Erreur chargement patients:', error);
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

  const handlePatientClick = async (patient: Patient) => {
    setSelectedPatient(patient);
    try {
      const { data } = await supabase
        .from('visites')
        .select('*')
        .eq('patient_id', patient.id)
        .order('date', { ascending: false });
      if (data) setPatientVisites(data);
    } catch (error) {
      console.error('Erreur chargement visites patient:', error);
      setPatientVisites([]);
    }
  };

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
            Chargement des patients...
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

  // Segment stats
  const segmentCounts = {
    all: patients.length,
    Chronique: patients.filter((p) => p.segment_ia === 'Chronique').length,
    Risque: patients.filter((p) => p.segment_ia === 'Risque').length,
    'Suivi régulier': patients.filter((p) => p.segment_ia === 'Suivi régulier')
      .length,
    Occasionnel: patients.filter((p) => p.segment_ia === 'Occasionnel').length,
  };

  const selectedSegStyle = selectedPatient
    ? getSegmentStyle(selectedPatient.segment_ia)
    : null;

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
                Patients
              </h1>
              <p className="text-sm text-[#6C757D] mt-1">
                <span className="font-bold text-[#2D6A4F]">
                  {patients.length}
                </span>{' '}
                patient{patients.length > 1 ? 's' : ''} enregistré
                {patients.length > 1 ? 's' : ''}
              </p>
            </div>

            {/* Segment summary pills */}
            <div className="hidden lg:flex items-center gap-2">
              {(
                [
                  'Chronique',
                  'Risque',
                  'Suivi régulier',
                  'Occasionnel',
                ] as const
              ).map((seg) => {
                const style = getSegmentStyle(seg);
                return (
                  <div
                    key={seg}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border"
                    style={{
                      background: style.bg,
                      color: style.color,
                      borderColor: style.border,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: style.color }}
                    />
                    {style.label}: {segmentCounts[seg]}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Patients Table */}
        <PatientsTable
          patients={patients}
          pharmacyName={profile.pharmacy_name || 'Pharmacie FATIMA'}
          onPatientClick={handlePatientClick}
        />

        {/* Patient Detail Modal */}
        <AnimatePresence>
          {selectedPatient && (
            <Modal
              isOpen={!!selectedPatient}
              onClose={() => setSelectedPatient(null)}
              title=""
              size="lg"
            >
              <div className="space-y-6">
                {/* Patient Header */}
                <div className="flex items-start gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white flex-shrink-0"
                    style={{
                      background: getAvatarGradient(selectedPatient.name),
                      boxShadow: '0 4px 14px rgba(45, 106, 79, 0.25)',
                    }}
                  >
                    {getInitials(selectedPatient.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-extrabold text-[#1A1A2E] tracking-tight">
                      {selectedPatient.name || 'Sans nom'}
                    </h2>
                    <p className="text-sm text-[#6C757D] mt-0.5">
                      {selectedPatient.phone}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {selectedSegStyle && (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border"
                          style={{
                            background: selectedSegStyle.bg,
                            color: selectedSegStyle.color,
                            borderColor: selectedSegStyle.border,
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
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                          </svg>
                          Segment IA:{' '}
                          {selectedPatient.segment_ia || 'Non classe'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="p-4 rounded-xl border"
                    style={{
                      background: 'rgba(45,106,79,0.03)',
                      borderColor: 'rgba(45,106,79,0.08)',
                    }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#6C757D] mb-1">
                      Score Fidelite
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${selectedPatient.score_fidelite}%`,
                            }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{
                              background: `linear-gradient(90deg, #2D6A4F, ${
                                selectedPatient.score_fidelite > 70
                                  ? '#52B788'
                                  : '#40916C'
                              })`,
                            }}
                          />
                        </div>
                      </div>
                      <span
                        className="text-lg font-extrabold"
                        style={{ color: '#2D6A4F' }}
                      >
                        {selectedPatient.score_fidelite}
                      </span>
                    </div>
                  </div>
                  <div
                    className="p-4 rounded-xl border"
                    style={{
                      background: 'rgba(45,106,79,0.03)',
                      borderColor: 'rgba(45,106,79,0.08)',
                    }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#6C757D] mb-1">
                      Enregistré le
                    </p>
                    <p className="text-lg font-extrabold text-[#1A1A2E]">
                      {formatDate(selectedPatient.created_at)}
                    </p>
                  </div>
                </div>

                {/* WhatsApp Action */}
                <a
                  href={generateWhatsAppUrl(
                    selectedPatient.phone,
                    selectedPatient.name || '',
                    profile.pharmacy_name || 'Pharmacie FATIMA',
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.01] hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                    boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Relancer via WhatsApp
                </a>

                {/* Visit Timeline */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="p-1.5 rounded-lg"
                      style={{ background: 'rgba(45,106,79,0.08)' }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#2D6A4F"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-bold text-[#1A1A2E]">
                      Historique des visites
                    </h4>
                    {patientVisites.length > 0 && (
                      <span className="text-[10px] font-bold text-[#6C757D] ml-auto">
                        {patientVisites.length} visite
                        {patientVisites.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {patientVisites.length === 0 ? (
                    <div className="text-center py-8">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                        style={{ background: 'rgba(108,117,125,0.06)' }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#9CA3AF"
                          strokeWidth="1.5"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <p className="text-sm text-[#6C757D]">
                        Aucune visite enregistrée
                      </p>
                    </div>
                  ) : (
                    <div
                      className="space-y-1.5 max-h-64 overflow-y-auto pr-1"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(45,106,79,0.2) transparent',
                      }}
                    >
                      {patientVisites.map((visite, index) => (
                        <motion.div
                          key={visite.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.04, duration: 0.3 }}
                          className="flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200"
                          style={{
                            background: 'rgba(45,106,79,0.02)',
                          }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLDivElement
                            ).style.background = 'rgba(45,106,79,0.05)';
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLDivElement
                            ).style.background = 'rgba(45,106,79,0.02)';
                          }}
                        >
                          {/* Timeline dot */}
                          <div className="flex flex-col items-center flex-shrink-0">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{
                                background:
                                  index === 0
                                    ? 'linear-gradient(135deg, #2D6A4F, #52B788)'
                                    : 'rgba(45,106,79,0.2)',
                                boxShadow:
                                  index === 0
                                    ? '0 0 8px rgba(45,106,79,0.3)'
                                    : 'none',
                              }}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#1A1A2E] truncate">
                              {visite.motif}
                            </p>
                          </div>

                          {/* Tag and Date */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {visite.tag && (
                              <Badge
                                variant={
                                  visite.tag === 'Chronique'
                                    ? 'green'
                                    : visite.tag === 'Conseil'
                                      ? 'orange'
                                      : visite.tag === 'Demande'
                                        ? 'red'
                                        : 'blue'
                                }
                                size="sm"
                              >
                                {visite.tag}
                              </Badge>
                            )}
                            <span className="text-[10px] text-[#9CA3AF] font-medium whitespace-nowrap">
                              {formatDateTime(visite.date)}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Modal>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
