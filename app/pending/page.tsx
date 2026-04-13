'use client';

import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

export default function PendingPage() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Green gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pharma-green-dark via-pharma-green to-pharma-green-medium" />

      {/* Decorative shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pharma-green-light/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-white/3 rounded-full blur-2xl" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 max-w-md mx-4 bg-white rounded-3xl shadow-2xl p-8 text-center"
      >
        {/* Animated hourglass/clock icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: 0.2,
            duration: 0.5,
            type: 'spring',
            stiffness: 200,
          }}
          className="mx-auto mb-6"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center mx-auto border border-orange-100">
            <div className="animate-hourglass">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#E76F51"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-pharma-text mb-2">
            Demande en attente
          </h1>
          <p className="text-sm text-pharma-text-secondary leading-relaxed mb-6">
            Votre demande d&apos;acces administrateur est en cours de validation
            par le super-administrateur. Vous recevrez une notification des que
            votre compte sera active.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="bg-gradient-to-r from-pharma-green/5 to-pharma-green-light/5 rounded-2xl p-5 mb-6 border border-pharma-green/10"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-pharma-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2D6A4F"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <p className="text-xs text-pharma-text-secondary text-left leading-relaxed">
              Le super-administrateur examine les nouvelles demandes
              régulierement. Si votre demande n&apos;est pas traitee sous 24h,
              contactez votre pharmacie.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="space-y-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-gradient-to-r from-pharma-green to-pharma-green-medium text-white text-sm font-semibold shadow-md hover:shadow-lg hover:shadow-pharma-green/25 transition-all duration-200"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Verifier le statut
          </motion.button>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 h-11 text-sm font-medium text-pharma-text-secondary hover:text-red-600 transition-colors duration-200"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Se deconnecter
          </button>
        </motion.div>

        {/* Decorative bottom accent */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-pharma-green to-pharma-green-light rounded-full mb-3" />
      </motion.div>
    </div>
  );
}
