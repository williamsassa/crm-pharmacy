'use client';

import Input from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import type { VisiteTag } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import SuccessAnimation from './SuccessAnimation';

interface PatientFormProps {
  onSuccess?: () => void;
}

const TAG_OPTIONS: {
  value: VisiteTag;
  label: string;
  icon: JSX.Element;
  gradient: string;
  activeGradient: string;
  ringColor: string;
}[] = [
  {
    value: 'Chronique',
    label: 'CHRONIQUE',
    icon: (
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
    ),
    gradient: 'from-pharma-green/5 to-pharma-green-light/5',
    activeGradient: 'from-pharma-green to-pharma-green-medium',
    ringColor: 'ring-pharma-green/30',
  },
  {
    value: 'Conseil',
    label: 'CONSEIL',
    icon: (
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
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
    gradient: 'from-pharma-blue/5 to-blue-50',
    activeGradient: 'from-pharma-blue to-blue-500',
    ringColor: 'ring-pharma-blue/30',
  },
  {
    value: 'Demande',
    label: 'DEMANDE',
    icon: (
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
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <path d="M16 12H8" />
        <path d="M12 16V8" />
      </svg>
    ),
    gradient: 'from-orange-50 to-amber-50',
    activeGradient: 'from-orange-500 to-amber-500',
    ringColor: 'ring-orange-300',
  },
  {
    value: 'Ordonnance',
    label: 'ORDONNANCE',
    icon: (
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
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M9 9h6" />
        <path d="M9 13h6" />
        <path d="M9 17h2" />
      </svg>
    ),
    gradient: 'from-pharma-purple/5 to-purple-50',
    activeGradient: 'from-purple-500 to-pharma-purple',
    ringColor: 'ring-pharma-purple/30',
  },
];

export default function PatientForm({ onSuccess }: PatientFormProps) {
  const [phone, setPhone] = useState('');
  const [isWhatsapp, setIsWhatsapp] = useState(false);
  const [name, setName] = useState('');
  const [motif, setMotif] = useState('');
  const [medicament, setMedicament] = useState('');
  const [tag, setTag] = useState<VisiteTag | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successName, setSuccessName] = useState('');
  const [error, setError] = useState('');
  const [existingPatient, setExistingPatient] = useState<string | null>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const { token } = useAuth();

  useEffect(() => {
    phoneRef.current?.focus();
  }, []);

  const searchPatient = useCallback(
    async (phoneValue: string) => {
      if (phoneValue.length < 8) {
        setExistingPatient(null);
        setName('');
        return;
      }

      try {
        const res = await fetch(
          `/api/patients/list?phone=${encodeURIComponent(phoneValue)}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );
        if (res.ok) {
          const data = await res.json();
          if (data.patient) {
            setExistingPatient(data.patient.name);
            setName(data.patient.name || '');
            setIsWhatsapp(!!data.patient.is_whatsapp);
          } else {
            setExistingPatient(null);
            setIsWhatsapp(false);
          }
        }
      } catch {
        // Ignore search errors
      }
    },
    [token],
  );

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setError('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPatient(value), 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !motif || !tag) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/patients/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          phone,
          name,
          motif,
          medicament,
          tag,
          is_whatsapp: isWhatsapp,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }

      setSuccessName(name || phone);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSuccessName('');
        setPhone('');
        setName('');
        setMedicament('');
        setMotif('');
        setTag(null);
        setExistingPatient(null);
        setIsWhatsapp(false);
        phoneRef.current?.focus();
        onSuccess?.();
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return <SuccessAnimation patientName={successName} duration={2500} />;
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit}
      className="w-full max-w-md mx-auto space-y-5"
    >
      {/* Phone Input - Primary field, larger */}
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <label
          htmlFor="phone-input"
          className="block text-sm font-medium text-pharma-text mb-2 items-center gap-2"
        >
          <span className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-md bg-pharma-green/10 text-pharma-green">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </span>
            <span>Téléphone du patient</span>
          </span>
        </label>
        <motion.div
          className="input-focus-glow rounded-xl transition-all duration-300"
          whileFocus={{ scale: 1.01 }}
        >
          <input
            ref={phoneRef}
            id="phone-input"
            type="tel"
            autoComplete="tel"
            placeholder="+33 6 12 34 56 78"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className="w-full h-11 px-5 rounded-xl border-2 border-gray-200 bg-white text-lg font-medium text-pharma-text placeholder:text-pharma-text-secondary/40 focus:outline-none focus:border-pharma-green focus:ring-0 transition-all duration-300"
          />
        </motion.div>
        <AnimatePresence>
          {existingPatient && (
            <motion.div
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              className="overflow-hidden"
            >
              <p className="mt-2 text-sm text-pharma-green font-medium flex items-center gap-1.5 pl-1">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-pharma-green-light"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Patient existant : {existingPatient}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        {/* WhatsApp Checkbox */}
        <div className="flex items-center gap-2 mt-3 select-none">
          <input
            id="is-whatsapp"
            type="checkbox"
            checked={isWhatsapp}
            onChange={(e) => setIsWhatsapp(e.target.checked)}
            className="accent-green-500 h-4 w-4 rounded border-gray-300 focus:ring-0"
          />
          <label
            htmlFor="is-whatsapp"
            className="text-sm font-medium text-pharma-text flex items-center gap-1 cursor-pointer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 32 32"
              fill="none"
              className="inline-block text-green-500"
            >
              <circle cx="16" cy="16" r="16" fill="#25D366" />
              <path
                d="M23.53 19.53c-.34-.17-2.01-.99-2.32-1.11-.31-.12-.53-.17-.75.17s-.86 1.11-1.05 1.33c-.19.22-.39.25-.73.08-.34-.17-1.45-.54-2.75-1.71-1.02-.91-1.71-2.04-1.9-2.39-.2-.34-.02-.52.15-.69.16-.16.34-.39.51-.58.17-.19.22-.34.34-.56.11-.22.06-.42-.03-.59-.09-.17-.75-1.8-1.04-2.48-.27-.64-.54-.56-.75-.57-.19-.01-.41-.01-.64-.01-.22 0-.58.08-.89.41-.31.34-1.18 1.16-1.18 2.82s1.21 3.27 1.38 3.5c.17.22 2.22 3.43 5.55 4.68.77.27 1.36.43 1.83.55.77.19 1.47.16 2.03.09.62-.07 1.91-.78 2.18-1.54.27-.75.27-1.39.19-1.52-.07-.13-.27-.21-.56-.34z"
                fill="#fff"
              />
            </svg>
            Numéro WhatsApp
          </label>
        </div>
        {/* End WhatsApp Checkbox */}
      </motion.div>

      {/* Name Input */}
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Input
          label="Nom du patient"
          placeholder="Nom complet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="focus:border-pharma-green transition-all duration-300"
        />
      </motion.div>

      {/* Motif Input */}
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Input
          label="Motif de visite"
          placeholder="Ex: Renouvellement ordonnance, Douleurs..."
          value={motif}
          onChange={(e) => {
            setMotif(e.target.value);
            setError('');
          }}
          className="focus:border-pharma-green transition-all duration-300"
        />
      </motion.div>

      {/* Médicament Input */}
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Input
          label="Médicament"
          placeholder="Ex: Paracétamol, Bledina"
          value={medicament}
          onChange={(e) => {
            setMedicament(e.target.value);
            setError('');
          }}
          className="focus:border-pharma-green transition-all duration-300"
        />
      </motion.div>

      {/* Tag Selector Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <label className="block text-sm font-medium text-pharma-text mb-3">
          Type de visite
        </label>
        <div className="grid grid-cols-2 gap-3">
          {TAG_OPTIONS.map((option) => {
            const isActive = tag === option.value;

            return (
              <motion.button
                key={option.value}
                type="button"
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setTag(option.value);
                  setError('');
                }}
                className={`relative flex flex-col items-center gap-2.5 py-4 px-3 rounded-xl font-semibold text-xs tracking-wide transition-all duration-300 overflow-hidden ${
                  isActive
                    ? `bg-gradient-to-br ${option.activeGradient} text-white shadow-lg ring-2 ${option.ringColor}`
                    : `bg-gradient-to-br ${option.gradient} text-pharma-text-secondary hover:shadow-md border border-gray-100`
                }`}
              >
                {/* Active shimmer overlay */}
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 shimmer pointer-events-none"
                  />
                )}

                <motion.div
                  animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {option.icon}
                </motion.div>
                <span>{option.label}</span>

                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white/60"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-red-500 text-center py-1 flex items-center justify-center gap-1.5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="relative w-full h-14 rounded-xl text-white text-lg font-semibold btn-gradient-green disabled:opacity-50 disabled:pointer-events-none overflow-hidden transition-all duration-400"
        >
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2"
            >
              <svg
                className="h-5 w-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span>Enregistrement...</span>
            </motion.div>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              VALIDER
            </span>
          )}

          {/* Hover shimmer */}
          <div className="absolute inset-0 shimmer opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
        </motion.button>
      </motion.div>
    </motion.form>
  );
}
