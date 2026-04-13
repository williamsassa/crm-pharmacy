'use client';

import type { PharmacyStats } from '@/types';
import { motion } from 'framer-motion';

interface PharmaciesListProps {
  pharmacies: PharmacyStats[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export default function PharmaciesList({ pharmacies }: PharmaciesListProps) {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pharma-green/10 flex items-center justify-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2D6A4F"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-pharma-text">
              Pharmacies enregistrées
            </h3>
            <p className="text-xs text-pharma-text-secondary mt-0.5">
              {pharmacies.length} pharmacie{pharmacies.length !== 1 ? 's' : ''}{' '}
              active{pharmacies.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {pharmacies.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-pharma-gray flex items-center justify-center mx-auto mb-4">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6C757D"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-pharma-text">
              Aucune pharmacie enregistrée
            </p>
            <p className="text-xs text-pharma-text-secondary mt-1">
              Les pharmacies apparaitront ici
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {pharmacies.map((pharmacy) => (
              <motion.div
                key={pharmacy.pharmacy_id}
                variants={cardVariants}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="card-green-stripe rounded-xl border border-gray-100 bg-white hover:shadow-card-hover transition-shadow duration-200 overflow-hidden"
              >
                <div className="pt-6 pb-4 px-4">
                  {/* Pharmacy name */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pharma-green to-pharma-green-medium flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {(pharmacy.pharmacy_name || 'P')[0].toUpperCase()}
                      </div>
                      <h4 className="text-sm font-semibold text-pharma-text leading-tight">
                        {pharmacy.pharmacy_name || 'Sans nom'}
                      </h4>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                      Active
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-lg bg-pharma-gray">
                      <div className="flex justify-center mb-1">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#2D6A4F"
                          strokeWidth="2"
                        >
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </div>
                      <p className="text-lg font-bold text-pharma-green">
                        {pharmacy.total_patients}
                      </p>
                      <p className="text-[10px] text-pharma-text-secondary font-medium">
                        Patients
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-pharma-gray">
                      <div className="flex justify-center mb-1">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#40916C"
                          strokeWidth="2"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <p className="text-lg font-bold text-pharma-green-medium">
                        {pharmacy.total_admins}
                      </p>
                      <p className="text-[10px] text-pharma-text-secondary font-medium">
                        Admins
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-pharma-gray">
                      <div className="flex justify-center mb-1">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#52B788"
                          strokeWidth="2"
                        >
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="8.5" cy="7" r="4" />
                        </svg>
                      </div>
                      <p className="text-lg font-bold text-pharma-green-light">
                        {pharmacy.total_assistants}
                      </p>
                      <p className="text-[10px] text-pharma-text-secondary font-medium">
                        Assistants
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
