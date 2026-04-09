'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import { createSupabaseClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import Spinner from '@/components/ui/Spinner';
import type { Profile } from '@/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export default function ParametresPage() {
  const { profile, loading, token } = useRequireAuth(['admin', 'superadmin']);
  const [saving, setSaving] = useState(false);
  const [pharmacyName, setPharmacyName] = useState('');
  const [assistants, setAssistants] = useState<Profile[]>([]);
  const [saved, setSaved] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const supabase = createSupabaseClient();

  const loadData = useCallback(async () => {
    if (!profile) return;
    setPharmacyName(profile.pharmacy_name || '');

    const { data: assistantList } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'assistant')
      .eq('status', 'active');
    if (assistantList) setAssistants(assistantList);
    setDataLoading(false);
  }, [supabase, profile]);

  useEffect(() => {
    if (profile) loadData();
  }, [profile, loadData]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase
      .from('profiles')
      .update({ pharmacy_name: pharmacyName })
      .eq('id', profile.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleToggleAssistant = async (assistantId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'rejected' : 'active';
    await supabase.from('profiles').update({ status: newStatus }).eq('id', assistantId);
    loadData();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4F1] via-pharma-gray to-white">
      <Sidebar profile={profile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-[272px]">
        <TopBar
          profile={profile}
          title="Parametres"
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="p-6 lg:p-8">
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-pharma-green/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-pharma-text">Parametres</h1>
                <p className="text-sm text-pharma-text-secondary">Configuration de votre pharmacie</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-2xl space-y-6"
          >
            {/* Pharmacy Settings Card */}
            <motion.div
              variants={cardVariants}
              className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-pharma-green/5 to-transparent">
                <div className="flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <h3 className="text-base font-semibold text-pharma-text">Informations pharmacie</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="pharmacy-name" className="block text-sm font-medium text-pharma-text mb-1.5">
                    Nom de la pharmacie
                  </label>
                  <input
                    id="pharmacy-name"
                    type="text"
                    value={pharmacyName}
                    onChange={(e) => setPharmacyName(e.target.value)}
                    placeholder="Ex: Pharmacie FATIMA"
                    className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 bg-white text-pharma-text placeholder:text-pharma-text-secondary/50 focus:outline-none focus:ring-0 focus:border-pharma-green transition-colors duration-200"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pharma-green to-pharma-green-medium text-white text-sm font-semibold shadow-md hover:shadow-lg hover:shadow-pharma-green/25 transition-all duration-200 disabled:opacity-50"
                  >
                    {saving ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                      </svg>
                    )}
                    Enregistrer
                  </motion.button>
                  {saved && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="inline-flex items-center gap-1 text-sm text-pharma-green font-medium"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Enregistre
                    </motion.span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Team Management Card */}
            <motion.div
              variants={cardVariants}
              className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-pharma-green/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <h3 className="text-base font-semibold text-pharma-text">Equipe comptoir</h3>
                  </div>
                  {assistants.length > 0 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-pharma-green/10 text-pharma-green">
                      {assistants.length} assistant{assistants.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6">
                {assistants.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 rounded-2xl bg-pharma-gray flex items-center justify-center mx-auto mb-3">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6C757D" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-pharma-text">Aucun assistant enregistre</p>
                    <p className="text-xs text-pharma-text-secondary mt-1">Les assistants apparaitront ici</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assistants.map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-pharma-gray hover:bg-pharma-gray-light transition-colors duration-200 group">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pharma-green/20 to-pharma-green-light/20 flex items-center justify-center text-pharma-green text-sm font-bold">
                            {(a.email || a.phone || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-pharma-text">{a.email || a.phone}</p>
                            <p className="text-xs text-pharma-text-secondary">
                              Inscrit le {new Date(a.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${a.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                            {a.status === 'active' ? 'Actif' : 'Inactif'}
                          </span>
                          {/* Toggle switch */}
                          <button
                            onClick={() => handleToggleAssistant(a.id, a.status)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pharma-green ${a.status === 'active' ? 'bg-pharma-green' : 'bg-gray-300'}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${a.status === 'active' ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Account Info Card */}
            <motion.div
              variants={cardVariants}
              className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-pharma-green/5 to-transparent">
                <div className="flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  <h3 className="text-base font-semibold text-pharma-text">Informations du compte</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-1">
                  <div className="flex justify-between items-center py-3 px-4 rounded-xl hover:bg-pharma-gray transition-colors duration-200">
                    <div className="flex items-center gap-2.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6C757D" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                      </svg>
                      <span className="text-sm text-pharma-text-secondary">Email</span>
                    </div>
                    <span className="text-sm font-medium text-pharma-text">{profile.email || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 rounded-xl hover:bg-pharma-gray transition-colors duration-200">
                    <div className="flex items-center gap-2.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6C757D" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span className="text-sm text-pharma-text-secondary">Role</span>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-pharma-green to-pharma-green-medium text-white capitalize">
                      {profile.role}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 rounded-xl hover:bg-pharma-gray transition-colors duration-200">
                    <div className="flex items-center gap-2.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6C757D" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span className="text-sm text-pharma-text-secondary">Statut</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 capitalize">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {profile.status}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
