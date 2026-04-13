'use client';

import {
  getFirebaseAuth,
  googleProvider,
  RecaptchaVerifier,
} from '@/lib/firebase/client';
import {
  onAuthStateChanged,
  signInWithPhoneNumber,
  signInWithPopup,
  type ConfirmationResult,
} from 'firebase/auth';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const ThreeBackground = dynamic(
  () => import('@/components/layout/ThreeBackground'),
  {
    ssr: false,
  },
);

export default function LoginPage() {
  const [mode, setMode] = useState<'choice' | 'phone'>('choice');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showRoleChoice, setShowRoleChoice] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const router = useRouter();

  const redirectByRole = useCallback(
    async (token: string) => {
      try {
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          const profile = data.profile;

          if (profile.role === 'superadmin') {
            router.push('/dashboard/admin');
          } else if (profile.role === 'admin' && profile.status === 'active') {
            router.push('/dashboard/admin');
          } else if (profile.role === 'admin' && profile.status === 'pending') {
            router.push('/pending');
          } else {
            // Assistant or other roles: show role choice screen
            setAuthToken(token);
            setShowRoleChoice(true);
            setCheckingAuth(false);
            setLoading(false);
          }
        } else {
          router.push('/dashboard/comptoir');
        }
      } catch {
        router.push('/dashboard/comptoir');
      }
    },
    [router],
  );

  const handleRoleChoice = async (choice: 'comptoir' | 'admin') => {
    if (choice === 'comptoir') {
      router.push('/dashboard/comptoir');
    } else {
      // Request admin role
      try {
        const res = await fetch('/api/admin/request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.result === 'approved' || data.result === 'already_admin') {
            router.push('/dashboard/admin');
          } else {
            router.push('/pending');
          }
        } else {
          router.push('/dashboard/comptoir');
        }
      } catch {
        router.push('/dashboard/comptoir');
      }
    }
  };

  useEffect(() => {
    const firebaseAuth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        await redirectByRole(token);
      } else {
        setCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [redirectByRole]);

  const setupRecaptcha = useCallback(() => {
    if (recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
    }
    if (recaptchaContainerRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        getFirebaseAuth(),
        recaptchaContainerRef.current,
        {
          size: 'invisible',
        },
      );
    }
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(getFirebaseAuth(), googleProvider);
      const token = await result.user.getIdToken();
      await redirectByRole(token);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur de connexion Google';
      if (!message.includes('popup-closed-by-user')) {
        setError(message);
      }
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!phone) {
      setError('Veuillez entrer votre numero de téléphone');
      return;
    }
    setLoading(true);
    setError('');
    try {
      setupRecaptcha();
      if (!recaptchaVerifierRef.current) {
        throw new Error('Erreur recaptcha');
      }
      const confirmation = await signInWithPhoneNumber(
        getFirebaseAuth(),
        phone,
        recaptchaVerifierRef.current,
      );
      setConfirmationResult(confirmation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'envoi du code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || !confirmationResult) {
      setError('Veuillez entrer le code recu');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await confirmationResult.confirm(otp);
      const token = await result.user.getIdToken();
      await redirectByRole(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code invalide');
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pharma-green-dark via-pharma-green to-pharma-green-medium">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            >
              <path d="M12 2v20M2 12h20" />
            </svg>
          </div>
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </motion.div>
      </div>
    );
  }

  if (showRoleChoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F4F1] via-pharma-gray to-white p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pharma-green to-pharma-green-light flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
              >
                <path d="M12 2v20M2 12h20" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-pharma-text">Bienvenue</h1>
            <p className="text-sm text-pharma-text-secondary mt-2">
              Comment souhaitez-vous accéder à l&apos;application ?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Comptoir button */}
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleChoice('comptoir')}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white border-2 border-gray-200 hover:border-pharma-green hover:shadow-lg transition-all duration-200"
            >
              <div className="w-14 h-14 rounded-xl bg-pharma-green/10 flex items-center justify-center">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2D6A4F"
                  strokeWidth="2"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-pharma-text">Comptoir</p>
                <p className="text-xs text-pharma-text-secondary mt-1">
                  Saisie rapide des patients
                </p>
              </div>
            </motion.button>

            {/* Admin button */}
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleChoice('admin')}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white border-2 border-gray-200 hover:border-pharma-blue hover:shadow-lg transition-all duration-200"
            >
              <div className="w-14 h-14 rounded-xl bg-pharma-blue/10 flex items-center justify-center">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1B4F72"
                  strokeWidth="2"
                >
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-pharma-text">
                  Administrateur
                </p>
                <p className="text-xs text-pharma-text-secondary mt-1">
                  Dashboard et pilotage IA
                </p>
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* ThreeBackground with lower opacity */}
      <div className="opacity-30">
        <ThreeBackground />
      </div>
      <div ref={recaptchaContainerRef} id="recaptcha-container" />

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-pharma-green-dark via-pharma-green to-pharma-green-medium">
        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-pharma-green-light/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full blur-2xl" />

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

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-center"
          >
            {/* Pharmacy cross icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.2,
                type: 'spring',
                stiffness: 200,
              }}
              className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto mb-8 shadow-lg"
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path d="M12 2v20M2 12h20" />
              </svg>
            </motion.div>

            <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
              Pharmacie FATIMA
            </h1>
            <p className="text-lg text-white/70 font-medium mb-2">
              CRM Intelligent
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-pharma-green-light to-white/30 rounded-full mx-auto my-6" />
            <p className="text-sm text-white/50 max-w-sm mx-auto leading-relaxed">
              Gerez vos patients, suivez les relances et optimisez votre
              pharmacie avec l&apos;intelligence artificielle.
            </p>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-wrap justify-center gap-3 mt-8"
            >
              {['Suivi patients', 'Relances auto', 'Chat IA', 'Analyses'].map(
                (feature, i) => (
                  <motion.span
                    key={feature}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="px-4 py-2 rounded-full text-xs font-medium bg-white/10 text-white/80 backdrop-blur-sm border border-white/10"
                  >
                    {feature}
                  </motion.span>
                ),
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-white via-pharma-gray to-white relative z-10">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Mobile branding - visible only on mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pharma-green to-pharma-green-medium flex items-center justify-center mx-auto mb-4 shadow-glow-green">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
              >
                <path d="M12 2v20M2 12h20" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-pharma-text">
              Pharmacie FATIMA
            </h1>
            <p className="text-sm text-pharma-text-secondary mt-1">
              CRM Intelligent
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-pharma-text">Connexion</h2>
              <p className="text-sm text-pharma-text-secondary mt-1">
                Connectez-vous pour accéder à votre espace
              </p>
            </div>

            {mode === 'choice' ? (
              <div className="space-y-4">
                {/* Google sign-in button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 h-12 px-6 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-sm font-semibold text-pharma-text transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <svg
                      className="w-5 h-5 animate-spin text-pharma-text-secondary"
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
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  Connexion avec Google
                </motion.button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-4 text-pharma-text-secondary font-medium">
                      ou
                    </span>
                  </div>
                </div>

                {/* Phone auth button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setMode('phone')}
                  className="w-full flex items-center justify-center gap-3 h-12 px-6 rounded-xl bg-gradient-to-r from-pharma-green to-pharma-green-medium text-white text-sm font-semibold shadow-md hover:shadow-lg hover:shadow-pharma-green/25 transition-all duration-200"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Connexion par téléphone
                </motion.button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {!confirmationResult ? (
                  <>
                    <div className="w-full">
                      <label
                        htmlFor="phone-input"
                        className="block text-sm font-medium text-pharma-text mb-1.5"
                      >
                        Numero de téléphone
                      </label>
                      <input
                        id="phone-input"
                        type="tel"
                        placeholder="+33 6 12 34 56 78"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setError('');
                        }}
                        className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 bg-white text-pharma-text placeholder:text-pharma-text-secondary/50 focus:outline-none focus:ring-0 focus:border-pharma-green transition-colors duration-200"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleSendOTP}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-gradient-to-r from-pharma-green to-pharma-green-medium text-white text-sm font-semibold shadow-md hover:shadow-lg hover:shadow-pharma-green/25 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {loading && (
                        <svg
                          className="w-4 h-4 animate-spin"
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
                      )}
                      Envoyer le code
                    </motion.button>
                  </>
                ) : (
                  <>
                    <div className="text-center p-3 bg-pharma-green/5 rounded-xl border border-pharma-green/10">
                      <p className="text-sm text-pharma-green font-medium">
                        Code envoye au {phone}
                      </p>
                    </div>
                    <div className="w-full">
                      <label
                        htmlFor="otp-input"
                        className="block text-sm font-medium text-pharma-text mb-1.5"
                      >
                        Code de verification
                      </label>
                      <input
                        id="otp-input"
                        type="text"
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value);
                          setError('');
                        }}
                        maxLength={6}
                        className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 bg-white text-pharma-text text-center text-xl font-bold tracking-[0.5em] placeholder:text-pharma-text-secondary/50 placeholder:text-base placeholder:tracking-normal placeholder:font-normal focus:outline-none focus:ring-0 focus:border-pharma-green transition-colors duration-200"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleVerifyOTP}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-gradient-to-r from-pharma-green to-pharma-green-medium text-white text-sm font-semibold shadow-md hover:shadow-lg hover:shadow-pharma-green/25 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {loading && (
                        <svg
                          className="w-4 h-4 animate-spin"
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
                      )}
                      Verifier
                    </motion.button>
                  </>
                )}

                <button
                  onClick={() => {
                    setMode('choice');
                    setConfirmationResult(null);
                    setError('');
                  }}
                  className="w-full flex items-center justify-center gap-2 text-sm text-pharma-text-secondary hover:text-pharma-text transition-colors py-2"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Retour
                </button>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100"
              >
                <p className="text-sm text-red-600 text-center font-medium">
                  {error}
                </p>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-pharma-text-secondary/50 mt-6">
            CRM Pharmacie FATIMA &mdash; Gestion intelligente
          </p>
        </motion.div>
      </div>
    </div>
  );
}
