'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Profile } from '@/types';

interface TopBarProps {
  profile: Profile;
  title?: string;
  onMenuToggle?: () => void;
}

export default function TopBar({ profile, title, onMenuToggle }: TopBarProps) {
  const { logout } = useAuth();
  const [currentTime, setCurrentTime] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const userInitial = (profile.email || profile.phone || '?')[0].toUpperCase();

  return (
    <header className="green-accent-top h-16 bg-white shadow-sm flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        {isMobile && onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="p-2 -ml-2 text-pharma-text-secondary hover:text-pharma-green hover:bg-pharma-green/5 rounded-xl transition-colors"
            aria-label="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        {title && (
          <div>
            <h1 className="text-lg font-semibold text-pharma-text">{title}</h1>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Time display */}
        {currentTime && (
          <div className="hidden sm:flex items-center gap-1.5 text-sm text-pharma-text-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="font-medium tabular-nums">{currentTime}</span>
          </div>
        )}

        {/* Separator */}
        <div className="hidden sm:block w-px h-6 bg-gray-200" />

        {/* User info + avatar */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-pharma-text truncate max-w-[160px]">
              {profile.email || profile.phone}
            </p>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-pharma-green/10 text-pharma-green">
              {profile.role}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pharma-green to-pharma-green-medium flex items-center justify-center text-white text-sm font-bold shadow-sm">
            {userInitial}
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={logout}
          className="p-2 text-pharma-text-secondary hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
          title="Deconnexion"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </header>
  );
}
