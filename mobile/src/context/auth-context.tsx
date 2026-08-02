// src/context/auth-context.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_ENDPOINTS } from '@/constants/api';

// ── تخزين آمن يدعم الويب والهاتف دون أخطاء ────────────────────────
const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') localStorage.setItem(key, value);
      } catch {}
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {}
  },
  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') localStorage.removeItem(key);
      } catch {}
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
  },
};

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  niveau?: string;
  classe?: string;
  annee?: string;
  photo?: string;
  ecole?: string;
  telephone?: string;
  wilaya?: string;
  profilComplet?: boolean;
  pourcentageCompletion?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
  fetchStudentProfile: () => Promise<void>;
  studentProfile?: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedToken = await safeStorage.getItem('auth_token');
      if (storedToken) {
        const res = await fetch(API_ENDPOINTS.me, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user && data.user.role === 'STUDENT') {
            setToken(storedToken);
            setUser(data.user);
          } else {
            await logout();
            setError('تطبيق الهاتف مخصص لحسابات التلاميذ فقط.');
          }
        } else {
          await logout();
        }
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'خطأ في تسجيل الدخول');
        setLoading(false);
        return false;
      }

      if (data.success && data.user) {
        if (data.user.role !== 'STUDENT') {
          setError('حسابات التلاميذ فقط يمكنها تسجيل الدخول إلى تطبيق الهاتف.');
          setLoading(false);
          return false;
        }

        await safeStorage.setItem('auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setLoading(false);
        return true;
      }

      setError('خطأ غير متوقع، يرجى المحاولة مرة أخرى.');
      setLoading(false);
      return false;
    } catch (e) {
      console.error('Login error:', e);
      setError('تعذر الاتصال بالخادم، تحقق من اتصالك بالإنترنت.');
      setLoading(false);
      return false;
    }
  };

  const fetchStudentProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch(API_ENDPOINTS.me, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (e) {
      console.error('Failed to fetch student profile:', e);
    }
  };

  const logout = async () => {
    try {
      await safeStorage.deleteItem('auth_token');
      setUser(null);
      setToken(null);
      setError(null);
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        logout,
        updateUser,
        fetchStudentProfile,
        studentProfile: user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};