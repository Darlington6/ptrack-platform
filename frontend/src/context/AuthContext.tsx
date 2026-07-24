import * as Sentry from '@sentry/react';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthContextType, RegisterPayload, RegisterRequest, User } from '../types';
import client from '../api/client';
import { useAuthStore } from '../stores/authStore';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function setUser(u: User | null) {
    setUserState(u);
    useAuthStore.getState().setUser(u);
  }

  useEffect(() => {
    const token = useAuthStore.getState().accessToken ?? localStorage.getItem('access_token');
    if (token) {
      if (!useAuthStore.getState().accessToken) {
        const refresh = localStorage.getItem('refresh_token') ?? '';
        useAuthStore.getState().setTokens(token, refresh);
      }
      client
        .get('/auth/me/')
        .then((res) => {
          const userData = res.data as User;
          setUser(userData);
          Sentry.setUser({
            id: userData.id.toString(),
            username: userData.username,
            email: userData.email,
          });
        })
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          useAuthStore.getState().clearAuth();
          Sentry.setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  async function login(email: string, password: string): Promise<User> {
    const res = await client.post('/auth/login/', { email, password });
    const {
      access,
      refresh,
      user: userData,
    } = res.data as {
      access: string;
      refresh: string;
      user: User;
    };
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    useAuthStore.getState().setTokens(access, refresh);
    setUser(userData);
    sessionStorage.setItem('ptrack_just_logged_in', '1');
    Sentry.setUser(null);
    Sentry.setUser({
      id: userData.id.toString(),
      username: userData.username,
      email: userData.email,
    });
    return userData;
  }

  async function googleLogin(accessToken: string): Promise<User> {
    const res = await client.post('/auth/google/', { access_token: accessToken });
    const {
      access,
      refresh,
      user: userData,
    } = res.data as {
      access: string;
      refresh: string;
      user: User;
    };
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    useAuthStore.getState().setTokens(access, refresh);
    setUser(userData);
    sessionStorage.setItem('ptrack_just_logged_in', '1');
    Sentry.setUser({
      id: userData.id.toString(),
      username: userData.username,
      email: userData.email,
    });
    return userData;
  }

  async function register(payload: RegisterPayload): Promise<User> {
    const res = await client.post('/auth/register/', payload as RegisterRequest);
    const {
      access,
      refresh,
      user: userData,
    } = res.data as {
      access: string;
      refresh: string;
      user: User;
    };
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    useAuthStore.getState().setTokens(access, refresh);
    setUser(userData);
    sessionStorage.setItem('ptrack_just_logged_in', '1');
    Sentry.setUser({
      id: userData.id.toString(),
      username: userData.username,
      email: userData.email,
    });
    return userData;
  }

  function logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    useAuthStore.getState().clearAuth();
    Sentry.setUser(null);
    setUser(null);
  }

  async function refreshUser(): Promise<User> {
    const res = await client.get('/auth/me/');
    const userData = res.data as User;
    setUser(userData);
    return userData;
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    googleLogin,
    logout,
    refreshUser,
    setUser: (u) => setUser(u),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
