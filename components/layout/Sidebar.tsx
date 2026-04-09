'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import type { Profile } from '@/types';

interface SidebarProps {
  profile: Profile;
  isOpen?: boolean;
  onClose?: () => void;
}

const adminNavItems = [
  {
    label: 'Tableau de bord',
    href: '/dashboard/admin',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: 'Patients',
    href: '/dashboard/admin/patients',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Relances',
    href: '/dashboard/admin/relances',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    label: 'Chat IA',
    href: '/dashboard/admin/chat',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: 'Parametres',
    href: '/dashboard/admin/parametres',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

const sidebarVariants = {
  open: {
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  closed: {
    x: '-100%',
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
};

const overlayVariants = {
  open: { opacity: 1 },
  closed: { opacity: 0 },
};

export default function Sidebar({ profile, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const userInitial = (profile.email || profile.phone || '?')[0].toUpperCase();

  const sidebarContent = (
    <aside
      className={cn(
        'h-screen w-[272px] flex flex-col z-50',
        'bg-pharma-green-dark',
        'relative overflow-hidden'
      )}
    >
      {/* Subtle glass overlay pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-pharma-green-light/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-20 left-0 w-24 h-24 bg-pharma-green-light/5 rounded-full -translate-x-1/2" />
      </div>

      {/* Brand / Logo area */}
      <div className="relative p-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pharma-green-light to-pharma-green flex items-center justify-center shadow-glow-green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2v20M2 12h20" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-white text-[15px] leading-tight">
              {profile.pharmacy_name || 'Pharmacie FATIMA'}
            </h1>
            <p className="text-[11px] text-pharma-green-light/70 font-medium tracking-wide uppercase mt-0.5">
              CRM Intelligent
            </p>
          </div>
        </div>
        {/* Divider with glow */}
        <div className="mt-5 h-px bg-gradient-to-r from-transparent via-pharma-green-light/20 to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-3 space-y-1 overflow-y-auto sidebar-scroll">
        {adminNavItems.map((item, index) => {
          const isActive =
            item.href === '/dashboard/admin'
              ? pathname === '/dashboard/admin'
              : pathname.startsWith(item.href);

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Link
                href={item.href}
                onClick={() => isMobile && onClose?.()}
                className={cn(
                  'nav-item-hover flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'nav-item-active bg-pharma-green-light/15 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                )}
              >
                <span
                  className={cn(
                    'flex-shrink-0 transition-colors duration-200',
                    isActive ? 'text-pharma-green-light' : 'text-white/50'
                  )}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-pharma-green-light"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* User info section */}
      <div className="relative p-4 mt-auto">
        <div className="h-px bg-gradient-to-r from-transparent via-pharma-green-light/20 to-transparent mb-4" />

        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pharma-green-light to-pharma-green-medium flex items-center justify-center text-white text-sm font-bold shadow-lg">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {profile.email || profile.phone}
            </p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-pharma-green-light/20 text-pharma-green-light mt-1">
              {profile.role}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 group"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Deconnexion
        </button>
      </div>
    </aside>
  );

  // Desktop: fixed sidebar
  if (!isMobile) {
    return (
      <div className="fixed left-0 top-0 h-screen z-40">
        {sidebarContent}
      </div>
    );
  }

  // Mobile: overlay sidebar with animation
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          <motion.div
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed left-0 top-0 h-screen z-50"
          >
            {sidebarContent}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
