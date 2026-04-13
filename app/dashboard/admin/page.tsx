'use client';

import AlertesPanel from '@/components/admin/AlertesPanel';
import KPICard from '@/components/admin/KPICard';
import VisitesChart from '@/components/admin/VisitesChart';
import Sidebar from '@/components/layout/Sidebar';
import PendingAdmins from '@/components/superadmin/PendingAdmins';
import PharmaciesList from '@/components/superadmin/PharmaciesList';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { useRequireAuth } from '@/hooks/useAuth';
import { createSupabaseClient } from '@/lib/supabase/client';
import { formatDate, formatDateTime } from '@/lib/utils';
import type {
  KPIData,
  Patient,
  PatientAlerte,
  PendingAdmin,
  PharmacyStats,
  VisiteChartData,
  VisiteWithPatient,
} from '@/types';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

const ThreeBackground = dynamic(
  () => import('@/components/layout/ThreeBackground'),
  {
    ssr: false,
  },
);

export default function AdminDashboardPage() {
  const { profile, loading, token, logout } = useRequireAuth([
    'admin',
    'superadmin',
  ]);
  const isSuperAdmin = profile?.role === 'superadmin';
  const [kpis, setKpis] = useState<KPIData>({
    total_patients: 0,
    patients_chroniques: 0,
    visites_jour: 0,
    taux_retour: 0,
  });
  const [chartData, setChartData] = useState<VisiteChartData[]>([]);
  const [recentVisites, setRecentVisites] = useState<VisiteWithPatient[]>([]);
  const [alertes, setAlertes] = useState<PatientAlerte[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientSegmentFilter, setPatientSegmentFilter] =
    useState<string>('all');
  // Superadmin-specific states
  const [pendingAdmins, setPendingAdmins] = useState<PendingAdmin[]>([]);
  const [pharmacies, setPharmacies] = useState<PharmacyStats[]>([]);

  const supabase = useMemo(() => createSupabaseClient(), []);

  const loadData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Run all independent queries in parallel
      const [
        { count: totalPatients },
        { count: chroniques },
        { count: visitesJour },
        { data: patientsData },
        { data: visites },
        { data: risquePatients },
      ] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('segment_ia', 'Chronique'),
        supabase
          .from('visites')
          .select('*', { count: 'exact', head: true })
          .gte('date', `${today}T00:00:00`),
        supabase
          .from('patients')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('visites')
          .select('*, patients(name, phone, segment_ia)')
          .order('date', { ascending: false })
          .limit(5),
        supabase
          .from('patients')
          .select('*')
          .in('segment_ia', ['Chronique', 'Risque']),
      ]);

      // Calculate taux_retour from already loaded patients (no extra queries)
      let tauxRetour = 0;
      if (patientsData && patientsData.length > 0) {
        const sampleIds = patientsData
          .slice(0, 50)
          .map((p: { id: string }) => p.id);
        const { data: visiteCounts } = await supabase
          .from('visites')
          .select('patient_id')
          .in('patient_id', sampleIds);
        if (visiteCounts) {
          const countMap = new Map<string, number>();
          for (const v of visiteCounts) {
            countMap.set(v.patient_id, (countMap.get(v.patient_id) || 0) + 1);
          }
          let returning = 0;
          for (const [, count] of Array.from(countMap.entries())) {
            if (count > 1) returning++;
          }
          tauxRetour = Math.round((returning / sampleIds.length) * 100);
        }
      }

      setKpis({
        total_patients: totalPatients || 0,
        patients_chroniques: chroniques || 0,
        visites_jour: visitesJour || 0,
        taux_retour: tauxRetour,
      });

      // Build chart data: fetch all visites from last 7 days in one query
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const startDate = sevenDaysAgo.toISOString().split('T')[0];
      const { data: weekVisites } = await supabase
        .from('visites')
        .select('date')
        .gte('date', `${startDate}T00:00:00`);

      const chart: VisiteChartData[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const count =
          weekVisites?.filter((v: { date: string }) =>
            v.date.startsWith(dateStr),
          ).length || 0;
        chart.push({
          date: d.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
          }),
          visites: count,
        });
      }
      setChartData(chart);

      if (visites) setRecentVisites(visites as unknown as VisiteWithPatient[]);

      // Build alerts from risque patients (single batch query instead of loop)
      const alertList: PatientAlerte[] = [];
      if (risquePatients && risquePatients.length > 0) {
        const riskIds = risquePatients.map((p: { id: string }) => p.id);
        const { data: lastVisites } = await supabase
          .from('visites')
          .select('patient_id, date')
          .in('patient_id', riskIds)
          .order('date', { ascending: false });

        const lastVisitMap = new Map<string, string>();
        if (lastVisites) {
          for (const v of lastVisites) {
            if (!lastVisitMap.has(v.patient_id)) {
              lastVisitMap.set(v.patient_id, v.date);
            }
          }
        }

        for (const p of risquePatients) {
          const lastDate = lastVisitMap.get(p.id);
          if (lastDate) {
            const daysSince = Math.floor(
              (Date.now() - new Date(lastDate).getTime()) /
                (1000 * 60 * 60 * 24),
            );
            if (daysSince > 30) {
              alertList.push({
                id: p.id,
                name: p.name,
                phone: p.phone,
                segment_ia: p.segment_ia,
                derniere_visite: lastDate,
                jours_sans_visite: daysSince,
              });
            }
          }
        }
      }
      setAlertes(alertList);
      if (patientsData) setPatients(patientsData);

      // Superadmin-specific data
      if (isSuperAdmin && token) {
        try {
          const res = await fetch('/api/admin/pending', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setPendingAdmins(data.admins || []);
          }
        } catch {
          /* ignore */
        }

        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('*');
        const pharmacyMap = new Map<string, PharmacyStats>();
        if (allProfiles) {
          for (const p of allProfiles) {
            const name = p.pharmacy_name || 'Non defini';
            if (!pharmacyMap.has(name)) {
              pharmacyMap.set(name, {
                pharmacy_id: p.id,
                pharmacy_name: name,
                total_patients: 0,
                total_admins: 0,
                total_assistants: 0,
              });
            }
            const entry = pharmacyMap.get(name)!;
            if (p.role === 'admin') entry.total_admins++;
            if (p.role === 'assistant') entry.total_assistants++;
          }
        }
        setPharmacies(Array.from(pharmacyMap.values()));
      }
    } catch (error) {
      console.error('Erreur chargement données dashboard:', error);
      setDataError(
        'Les tables de données ne sont pas encore disponibles. Veuillez configurer la base de données Supabase.',
      );
    } finally {
      setDataLoading(false);
    }
  }, [supabase, isSuperAdmin, token]);

  useEffect(() => {
    if (profile) loadData();
  }, [profile, loadData]);

  const handleValidate = async (id: string, action: 'approve' | 'reject') => {
    if (!token) return;
    const res = await fetch('/api/admin/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId: id, action }),
    });
    if (res.ok) {
      setPendingAdmins((prev) => prev.filter((a) => a.id !== id));
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
            Chargement du tableau de bord...
          </p>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div
        className="min-h-screen relative"
        style={{
          background:
            'linear-gradient(135deg, #F8F9FA 0%, #EDF5F0 40%, #F0FAF4 70%, #F8F9FA 100%)',
        }}
      >
        <div className="opacity-20">
          <ThreeBackground />
        </div>
        <Sidebar profile={profile} />
        <main className="lg:ml-[272px] p-6 lg:p-8 relative z-10">
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

  const quickLinks = [
    {
      label: 'Chat IA',
      href: '/dashboard/admin/chat',
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      description: 'Assistant intelligent',
    },
    {
      label: 'Patients',
      href: '/dashboard/admin/patients',
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      description: 'Gestion des patients',
    },
    {
      label: 'Relances',
      href: '/dashboard/admin/relances',
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
        </svg>
      ),
      description: 'Suivi des relances',
    },
  ];

  function getSegmentStyle(segment: string | null) {
    switch (segment) {
      case 'Chronique':
        return { color: '#2D6A4F', bg: 'rgba(45,106,79,0.1)' };
      case 'Risque':
        return { color: '#DC2626', bg: 'rgba(220,38,38,0.08)' };
      case 'Suivi régulier':
        return { color: '#2563EB', bg: 'rgba(37,99,235,0.08)' };
      default:
        return { color: '#6C757D', bg: 'rgba(108,117,125,0.08)' };
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

  return (
    <div
      className="min-h-screen relative"
      style={{
        background:
          'linear-gradient(135deg, #F8F9FA 0%, #EDF5F0 40%, #F0FAF4 70%, #F8F9FA 100%)',
      }}
    >
      {/* 3D Animated Background */}
      <div className="opacity-20">
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
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-[#1A1A2E] tracking-tight">
                  Tableau de bord
                </h1>
                {isSuperAdmin && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-pharma-green to-pharma-green-medium text-white shadow-sm">
                    Super Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-[#6C757D] mt-1">
                Bienvenue,{' '}
                <span className="font-semibold text-[#2D6A4F]">
                  {profile.email || profile.phone}
                </span>
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-[#6C757D]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium">Système actif</span>
            </div>
          </div>
        </motion.div>

        {/* Quick Access Bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8"
        >
          {quickLinks.map((link, i) => (
            <Link key={link.href} href={link.href}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 px-5 py-3.5 rounded-xl border cursor-pointer transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.8)',
                  borderColor: 'rgba(45,106,79,0.08)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div
                  className="p-2.5 rounded-lg"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(45,106,79,0.08) 0%, rgba(82,183,136,0.12) 100%)',
                    color: '#2D6A4F',
                  }}
                >
                  {link.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1A1A2E]">
                    {link.label}
                  </p>
                  <p className="text-[10px] text-[#6C757D] font-medium">
                    {link.description}
                  </p>
                </div>
                <svg
                  className="ml-auto text-[#9CA3AF]"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Total patients"
            value={kpis.total_patients}
            index={0}
            trend={{ value: 12, positive: true }}
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
          <KPICard
            title="Chroniques"
            value={kpis.patients_chroniques}
            index={1}
            subtitle="Segment IA"
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            }
          />
          <KPICard
            title="Visites du jour"
            value={kpis.visites_jour}
            index={2}
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
          />
          <KPICard
            title="Taux de retour"
            value={`${kpis.taux_retour}%`}
            index={3}
            trend={{ value: 5, positive: true }}
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            }
          />
        </div>

        {/* Charts and Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <VisitesChart data={chartData} />
          </div>
          <AlertesPanel
            alertes={alertes}
            pharmacyName={profile.pharmacy_name || 'Pharmacie FATIMA'}
          />
        </div>

        {/* Patients Database Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-2xl border border-white/20 backdrop-blur-xl mb-8"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.88) 100%)',
            boxShadow:
              '0 4px 24px rgba(45, 106, 79, 0.08), 0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <div
            className="px-6 pt-6 pb-4 flex items-center justify-between border-b"
            style={{ borderColor: 'rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(45,106,79,0.08) 0%, rgba(82,183,136,0.12) 100%)',
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2D6A4F"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1A1A2E]">
                  Base de données patients
                </h3>
                <p className="text-[10px] text-[#6C757D] font-medium mt-0.5">
                  {patients.length} patient{patients.length > 1 ? 's' : ''} en
                  base
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/admin/patients"
              className="text-xs font-bold flex items-center gap-1 transition-colors duration-200"
              style={{ color: '#2D6A4F' }}
            >
              Voir détails
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
            </Link>
          </div>

          {/* Filters */}
          <div
            className="px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 border-b"
            style={{ borderColor: 'rgba(0,0,0,0.04)' }}
          >
            <div className="relative flex-1 w-full sm:max-w-xs">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher un patient..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border bg-white/60 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F]/30 transition-all"
                style={{ borderColor: 'rgba(0,0,0,0.08)' }}
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                'all',
                'Chronique',
                'Risque',
                'Suivi régulier',
                'Occasionnel',
              ].map((seg) => {
                const isActive = patientSegmentFilter === seg;
                const segStyle =
                  seg === 'all'
                    ? { color: '#2D6A4F', bg: 'rgba(45,106,79,0.08)' }
                    : getSegmentStyle(seg);
                return (
                  <button
                    key={seg}
                    onClick={() => setPatientSegmentFilter(seg)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-200 border"
                    style={{
                      background: isActive ? segStyle.bg : 'transparent',
                      color: isActive ? segStyle.color : '#9CA3AF',
                      borderColor: isActive
                        ? segStyle.color + '40'
                        : 'transparent',
                    }}
                  >
                    {seg === 'all' ? 'Tous' : seg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderColor: 'rgba(0,0,0,0.04)' }}
                >
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#6C757D]">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#6C757D]">
                    Téléphone
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#6C757D]">
                    Segment IA
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#6C757D]">
                    Score Fidelite
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#6C757D]">
                    Dernier motif
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#6C757D]">
                    Date création
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filtered = patients.filter((p) => {
                    const matchSearch =
                      patientSearch === '' ||
                      (p.name || '')
                        .toLowerCase()
                        .includes(patientSearch.toLowerCase()) ||
                      p.phone.includes(patientSearch);
                    const matchSegment =
                      patientSegmentFilter === 'all' ||
                      p.segment_ia === patientSegmentFilter;
                    return matchSearch && matchSegment;
                  });

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-10 text-center text-sm text-[#6C757D]"
                        >
                          Aucun patient trouvé
                        </td>
                      </tr>
                    );
                  }

                  return filtered.slice(0, 20).map((patient, index) => {
                    const segStyle = getSegmentStyle(patient.segment_ia);
                    return (
                      <motion.tr
                        key={patient.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.25 }}
                        className="border-b transition-colors duration-150 cursor-pointer hover:bg-[rgba(45,106,79,0.02)]"
                        style={{ borderColor: 'rgba(0,0,0,0.03)' }}
                        onClick={() =>
                          (window.location.href = '/dashboard/admin/patients')
                        }
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                              style={{
                                background: getAvatarGradient(patient.name),
                              }}
                            >
                              {getInitials(patient.name)}
                            </div>
                            <span className="text-sm font-semibold text-[#1A1A2E] truncate max-w-[150px]">
                              {patient.name || 'Sans nom'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-[#6C757D] font-mono">
                            {patient.phone}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                            style={{
                              background: segStyle.bg,
                              color: segStyle.color,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: segStyle.color }}
                            />
                            {patient.segment_ia || 'Non classe'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${patient.score_fidelite}%`,
                                  background:
                                    patient.score_fidelite > 70
                                      ? 'linear-gradient(90deg, #2D6A4F, #52B788)'
                                      : patient.score_fidelite > 40
                                        ? 'linear-gradient(90deg, #40916C, #74C69D)'
                                        : 'linear-gradient(90deg, #9CA3AF, #D1D5DB)',
                                }}
                              />
                            </div>
                            <span
                              className="text-xs font-bold"
                              style={{
                                color:
                                  patient.score_fidelite > 70
                                    ? '#2D6A4F'
                                    : patient.score_fidelite > 40
                                      ? '#40916C'
                                      : '#9CA3AF',
                              }}
                            >
                              {patient.score_fidelite}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-[#6C757D] truncate max-w-[150px] block">
                            {patient.motif_last_visit || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] text-[#9CA3AF] font-medium whitespace-nowrap">
                            {formatDate(patient.created_at)}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  });
                })()}
              </tbody>
            </table>
            {patients.filter((p) => {
              const matchSearch =
                patientSearch === '' ||
                (p.name || '')
                  .toLowerCase()
                  .includes(patientSearch.toLowerCase()) ||
                p.phone.includes(patientSearch);
              const matchSegment =
                patientSegmentFilter === 'all' ||
                p.segment_ia === patientSegmentFilter;
              return matchSearch && matchSegment;
            }).length > 20 && (
              <div
                className="px-6 py-3 text-center border-t"
                style={{ borderColor: 'rgba(0,0,0,0.04)' }}
              >
                <Link
                  href="/dashboard/admin/patients"
                  className="text-xs font-bold"
                  style={{ color: '#2D6A4F' }}
                >
                  Voir les{' '}
                  {
                    patients.filter((p) => {
                      const matchSearch =
                        patientSearch === '' ||
                        (p.name || '')
                          .toLowerCase()
                          .includes(patientSearch.toLowerCase()) ||
                        p.phone.includes(patientSearch);
                      const matchSegment =
                        patientSegmentFilter === 'all' ||
                        p.segment_ia === patientSegmentFilter;
                      return matchSearch && matchSegment;
                    }).length
                  }{' '}
                  patients →
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Patients Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-2xl border border-white/20 backdrop-blur-xl"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.88) 100%)',
            boxShadow:
              '0 4px 24px rgba(45, 106, 79, 0.08), 0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          {/* Section Header */}
          <div
            className="px-6 pt-6 pb-4 flex items-center justify-between border-b"
            style={{ borderColor: 'rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(45,106,79,0.08) 0%, rgba(82,183,136,0.12) 100%)',
                }}
              >
                <svg
                  width="18"
                  height="18"
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
              <div>
                <h3 className="text-sm font-bold text-[#1A1A2E]">
                  Dernières visites
                </h3>
                <p className="text-[10px] text-[#6C757D] font-medium mt-0.5">
                  Activité récente
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/admin/patients"
              className="text-xs font-bold flex items-center gap-1 transition-colors duration-200"
              style={{ color: '#2D6A4F' }}
            >
              Voir tout
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
            </Link>
          </div>

          {/* Patient Cards */}
          <div className="p-4">
            {recentVisites.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-[#6C757D]">
                  Aucune visite enregistrée.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentVisites.map((visite, index) => {
                  const segStyle = getSegmentStyle(
                    visite.patients?.segment_ia || null,
                  );
                  return (
                    <motion.div
                      key={visite.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05, duration: 0.3 }}
                      className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer"
                      style={{ background: 'transparent' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background =
                          'rgba(45,106,79,0.03)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background =
                          'transparent';
                      }}
                    >
                      {/* Avatar */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                        style={{
                          background: getAvatarGradient(
                            visite.patients?.name || null,
                          ),
                        }}
                      >
                        {getInitials(visite.patients?.name || null)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#1A1A2E] truncate">
                            {visite.patients?.name || 'Sans nom'}
                          </p>
                          {visite.patients?.segment_ia && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0"
                              style={{
                                background: segStyle.bg,
                                color: segStyle.color,
                              }}
                            >
                              {visite.patients.segment_ia}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6C757D] truncate mt-0.5">
                          {visite.motif}
                        </p>
                      </div>

                      {/* Tag and Date */}
                      <div className="flex items-center gap-3 flex-shrink-0">
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
                          >
                            {visite.tag}
                          </Badge>
                        )}
                        <span className="text-[11px] text-[#9CA3AF] font-medium whitespace-nowrap">
                          {formatDateTime(visite.date)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Superadmin Section: Pending Admins + Pharmacies */}
        {isSuperAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#E76F51"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#1A1A2E]">
                  Administration globale
                </h2>
                <p className="text-xs text-[#6C757D]">
                  Gestion des pharmacies et des demandes d&apos;acces
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PendingAdmins
                admins={pendingAdmins}
                onValidate={handleValidate}
              />
              <PharmaciesList pharmacies={pharmacies} />
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
