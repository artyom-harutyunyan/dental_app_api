import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { api } from '../api/services';
import type { AuthResponse, Clinic, User } from '../api/types';

const TOKEN_KEY = 'dental.app.token';
const USER_KEY = 'dental.app.user';

interface AuthState {
  token: string | null;
  user: User | null;
  clinic: Clinic | null;
  loading: boolean;
  setSession: (auth: AuthResponse) => Promise<void>;
  clearSession: () => void;
  refreshClinic: () => Promise<void>;
  isStaff: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

function readUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => readUser());
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(Boolean(token));

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setClinic(null);
  }, []);

  const refreshClinic = useCallback(async () => {
    if (!token) return;
    const c = await api.getClinic(token);
    setClinic(c);
  }, [token]);

  const setSession = useCallback(async (auth: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, auth.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    setToken(auth.accessToken);
    setUser(auth.user);
    const c = await api.getClinic(auth.accessToken);
    setClinic(c);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [me, c] = await Promise.all([api.me(token), api.getClinic(token)]);
        if (cancelled) return;
        setUser(me);
        localStorage.setItem(USER_KEY, JSON.stringify(me));
        setClinic(c);
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, clearSession]);

  const isStaff = user?.role === 'doctor' || user?.role === 'nurse';

  const value = useMemo(
    () => ({ token, user, clinic, loading, setSession, clearSession, refreshClinic, isStaff }),
    [token, user, clinic, loading, setSession, clearSession, refreshClinic, isStaff],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
