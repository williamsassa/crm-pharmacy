'use client';

import { getFirebaseAuth } from '@/lib/firebase/client';
import type { Profile } from '@/types';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  token: string | null;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getFreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  token: null,
  logout: async () => {},
  refreshProfile: async () => {},
  getFreshToken: async () => null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  const loadProfile = useCallback(async (firebaseUser: User) => {
    try {
      const idToken = await firebaseUser.getIdToken();
      setToken(idToken);

      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }, []);

  useEffect(() => {
    const firebaseAuth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      async (firebaseUser) => {
        setUser(firebaseUser);
        if (firebaseUser) {
          await loadProfile(firebaseUser);
        } else {
          setProfile(null);
          setToken(null);
        }
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [loadProfile]);

  // Auto-refresh token every 50 minutes (Firebase tokens expire after 60 min)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(
      async () => {
        try {
          const freshToken = await user.getIdToken(true);
          setToken(freshToken);
        } catch (e) {
          console.error('Token refresh failed:', e);
        }
      },
      50 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, [user]);

  const logout = useCallback(async () => {
    const firebaseAuth = getFirebaseAuth();
    await signOut(firebaseAuth);
    setUser(null);
    setProfile(null);
    setToken(null);
    router.push('/login');
  }, [router]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user);
    }
  }, [user, loadProfile]);

  // Get a fresh token on-demand (forces refresh if expired)
  const getFreshToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    try {
      const freshToken = await user.getIdToken(true);
      setToken(freshToken);
      return freshToken;
    } catch (e) {
      console.error('Failed to refresh token:', e);
      return token;
    }
  }, [user, token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        token,
        logout,
        refreshProfile,
        getFreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useRequireAuth(allowedRoles?: string[]) {
  const { user, profile, loading, token, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (profile && allowedRoles && !allowedRoles.includes(profile.role)) {
        if (profile.role === 'assistant') {
          router.push('/dashboard/comptoir');
        } else if (profile.role === 'admin' && profile.status === 'pending') {
          router.push('/pending');
        } else {
          router.push('/dashboard/comptoir');
        }
      }
    }
  }, [user, profile, loading, router, allowedRoles]);

  return { user, profile, loading, token, logout };
}
