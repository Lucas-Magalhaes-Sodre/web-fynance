import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import type { User } from '@/interfaces/financial';
import { unregisterWebPushSubscription } from '@/services/pushNotifications';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken: string, legalAccepted?: boolean) => Promise<void>;
  signUp: (name: string, email: string, password: string, marketingConsent?: boolean) => Promise<void>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext({} as AuthContextValue);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('@minha-receita:token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/users/me');
        setUser(data.user);
      } catch {
        localStorage.removeItem('@minha-receita:token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  async function signIn(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('@minha-receita:token', data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function signInWithGoogle(idToken: string, legalAccepted = false) {
    const { data } = await api.post('/auth/google', { idToken, ...(legalAccepted ? { legalAccepted: true } : {}) });
    localStorage.setItem('@minha-receita:token', data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function refreshUser() {
    const { data } = await api.get('/users/me');
    setUser(data.user);
  }

  async function signUp(name: string, email: string, password: string, marketingConsent = false) {
    const { data } = await api.post('/auth/register', {
      name,
      email,
      password,
      lgpdAccepted: true,
      termsAccepted: true,
      privacyAccepted: true,
      marketingConsent
    });
    localStorage.setItem('@minha-receita:token', data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function signOut() {
    try {
      await unregisterWebPushSubscription();
    } catch {
      // O logout nao deve falhar se a remocao do token push nao responder.
    }
    localStorage.removeItem('@minha-receita:token');
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, token, loading, signIn, signInWithGoogle, signUp, refreshUser, signOut }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
