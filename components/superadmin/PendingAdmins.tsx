'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDateTime } from '@/lib/utils';
import type { PendingAdmin } from '@/types';

interface PendingAdminsProps {
  admins: PendingAdmin[];
  onValidate: (id: string, action: 'approve' | 'reject') => Promise<void>;
}

export default function PendingAdmins({ admins, onValidate }: PendingAdminsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setLoadingId(id);
    try {
      await onValidate(id, action);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E76F51" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-pharma-text">Demandes en attente</h3>
              <p className="text-xs text-pharma-text-secondary mt-0.5">Demandes d&apos;acces administrateur</p>
            </div>
          </div>
          {admins.length > 0 && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
              {admins.length} en attente
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {admins.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <p className="text-sm font-medium text-pharma-text">Aucune demande en attente</p>
            <p className="text-xs text-pharma-text-secondary mt-1">Toutes les demandes ont ete traitees</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {admins.map((admin) => (
                <motion.div
                  key={admin.id}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -200, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="group p-4 bg-gradient-to-r from-orange-50/80 to-amber-50/40 rounded-xl border border-orange-100/60 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white border border-orange-100 flex items-center justify-center text-orange-600 text-sm font-bold flex-shrink-0">
                        {(admin.email || admin.phone || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-pharma-text truncate">
                          {admin.email || admin.phone || 'Inconnu'}
                        </p>
                        <p className="text-xs text-pharma-text-secondary mt-0.5">
                          Pharmacie : {admin.pharmacy_name || 'Non defini'}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-pharma-text-secondary">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {formatDateTime(admin.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAction(admin.id, 'approve')}
                        disabled={loadingId === admin.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-pharma-green to-pharma-green-medium rounded-xl hover:shadow-lg hover:shadow-pharma-green/25 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {loadingId === admin.id ? (
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        Accepter
                      </button>
                      <button
                        onClick={() => handleAction(admin.id, 'reject')}
                        disabled={loadingId === admin.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-red-600 border-2 border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Refuser
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
