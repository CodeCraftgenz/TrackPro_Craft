'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const STORAGE_KEY = 'trackpro_auth';

interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const getStoredAuth = (): StoredAuth | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  };

  const setStoredAuth = (tokens: AuthTokens) => {
    const auth: StoredAuth = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  };

  const clearStoredAuth = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  const fetchUser = useCallback(async (accessToken: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_URL}/api/v1/users/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch {
      return null;
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    const stored = getStoredAuth();
    if (!stored) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Check if token is expired or about to expire (within 1 minute)
    if (stored.expiresAt < Date.now() + 60000) {
      try {
        const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: stored.refreshToken }),
        });

        if (!response.ok) {
          clearStoredAuth();
          setUser(null);
          setIsLoading(false);
          return;
        }

        const tokens: AuthTokens = await response.json();
        setStoredAuth(tokens);
        stored.accessToken = tokens.accessToken;
      } catch {
        clearStoredAuth();
        setUser(null);
        setIsLoading(false);
        return;
      }
    }

    const userData = await fetchUser(stored.accessToken);
    setUser(userData);
    setIsLoading(false);
  }, [fetchUser]);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const tokens: AuthTokens = await response.json();
    setStoredAuth(tokens);

    const userData = await fetchUser(tokens.accessToken);
    setUser(userData);

    router.push('/projects');
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const tokens: AuthTokens = await response.json();
    setStoredAuth(tokens);

    const userData = await fetchUser(tokens.accessToken);
    setUser(userData);

    router.push('/projects');
  };

  const logout = async () => {
    const stored = getStoredAuth();

    if (stored) {
      try {
        await fetch(`${API_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${stored.accessToken}`,
          },
          body: JSON.stringify({ refreshToken: stored.refreshToken }),
        });
      } catch {
        // Ignore errors on logout
      }
    }

    clearStoredAuth();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
