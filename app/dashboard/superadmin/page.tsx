'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import { createSupabaseClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import PharmaciesList from '@/components/superadmin/PharmaciesList';
import PendingAdmins from '@/components/superadmin/PendingAdmins';
import Spinner from '@/components/ui/Spinner';
import type { PendingAdmin, PharmacyStats } from '@/types';

function AnimatedCounter({ value, delay = 0 }: { value: number; delay?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const end = value;
      if (end === 0) return;
      const duration = 1200;
      const stepTime = Math.max(Math.floor(duration / end), 20);

      const counter = setInterval(() => {
        start += 1;
        setCount(start);
        if (start >= end) {
          clearInterval(counter);
          setCount(end);
        }
      }, stepTime);

      return () => clearInterval(counter);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return <>{count}</>;
}

const kpiCards = [
  {
    key: 'users',
    title: 'Utilisateurs',
    gradient: 'from-[#2D6A4F] to-[#52B788]',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      </svg>
    ),
  },
  {
    key: 'pharmacies',
    title: 'Pharmacies',
    gradient: 'from-[#40916C] to-[#74C69D]',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    key: 'patients',
    title: 'Total Patients',
    gradient: 'from-[#1B4F72] to-[#2D6A4F]',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function SuperAdminPage() {
  const { profile, loading, token, logout } = useRequireAuth(['superadmin']);
  const [pendingAdmins, setPendingAdmins] = useState<PendingAdmin[]>([]);
  const [pharmacies, setPharmacies] = useState<PharmacyStats[]>([]);
  const [stats, setStats] = useState({ users: 0, pharmacies: 0, patients: 0 });
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const supabase = useMemo(() => createSupabaseClient(), []);

  const loadData = useCallback(async () => {
    if (!token) return;

    try {
      // Pending admins
      const res = await fetch('/api/admin/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPendingAdmins(data.admins || []);
      }

      // Stats
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: patientCount } = await supabase.from('patients').select('*', { count: 'exact', head: true });

      // Pharmacies
      const { data: allProfiles } = await supabase.from('profiles').select('*');
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

      for (const entry of Array.from(pharmacyMap.values())) {
        const { count } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('pharmacy_id', entry.pharmacy_id);
        entry.total_patients = count || 0;
      }

      setPharmacies(Array.from(pharmacyMap.values()));
      setStats({
        users: userCount || 0,
        pharmacies: pharmacyMap.size,
        patients: patientCount || 0,
      });
    } catch (error) {
      console.error('Erreur chargement donnees superadmin:', error);
      setDataError('Les tables de donnees ne sont pas encore disponibles. Veuillez configurer la base de donnees Supabase.');
    } finally {
      setDataLoading(false);
    }
  }, [supabase, token]);

  useEffect(() => {
    if (profile && token) loadData();
  }, [profile, token, loadData]);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F4F1] via-pharma-gray to-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pharma-green to-pharma-green-light flex items-center justify-center shadow-glow-green">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2v20M2 12h20" />
            </svg>
          </div>
          <Spinner size="lg" />
        </motion.div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0F4F1] via-pharma-gray to-white">
        <header className="green-accent-top bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pharma-green to-pharma-green-light flex items-center justify-center shadow-glow-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M12 2v20M2 12h20" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-pharma-text">Super Administration</h1>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(234,88,12,0.1)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">Donnees non disponibles</h2>
            <p className="text-sm text-[#6C757D] max-w-md mx-auto">{dataError}</p>
            <button onClick={() => { setDataError(null); setDataLoading(true); loadData(); }} className="mt-4 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)' }}>
              Reessayer
            </button>
          </div>
        </main>
      </div>
    );
  }

  const statsValues: Record<string, number> = {
    users: stats.users,
    pharmacies: stats.pharmacies,
    patients: stats.patients,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4F1] via-pharma-gray to-white">
      {/* Header */}
      <header className="green-accent-top bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pharma-green to-pharma-green-light flex items-center justify-center shadow-glow-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M12 2v20M2 12h20" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-pharma-text">Super Administration</h1>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-pharma-green to-pharma-green-medium text-white shadow-sm">
                    Super Admin
                  </span>
                </div>
                <p className="text-sm text-pharma-text-secondary mt-0.5">{profile.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-pharma-text-secondary hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="hidden sm:inline">Deconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8"
        >
          {kpiCards.map((card, index) => (
            <motion.div
              key={card.key}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-6 text-white shadow-lg`}
            >
              {/* Decorative circle */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-6 translate-x-6" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-4 -translate-x-4" />

              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80 mb-1">{card.title}</p>
                  <p className="text-4xl font-bold tracking-tight">
                    <AnimatedCounter value={statsValues[card.key]} delay={index * 200} />
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                  {card.icon}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Content Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <motion.div variants={itemVariants}>
            <PendingAdmins admins={pendingAdmins} onValidate={handleValidate} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <PharmaciesList pharmacies={pharmacies} />
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
