import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_ENDPOINTS } from '@/constants/api';

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  niveau?: string;
  photo?: string;
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
  studentProfile?: User;
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
      const storedToken = await SecureStore.getItemAsync('auth_token');
      if (storedToken) {
        // Verify token with backend
          console.log('Loading session from', API_ENDPOINTS.me, 'with token', storedToken);
          const res = await fetch(API_ENDPOINTS.me, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });

        if (res.ok) {
          const data = await res.json();
          if (data.user && data.user.role === 'STUDENT') {
            setToken(storedToken);
            setUser(data.user);
          } else {
            // Only students are allowed on the mobile app
            await logout();
            setError('Accès réservé aux étudiants.');
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur de connexion');
        setLoading(false);
        return false;
      }

      if (data.success && data.user) {
        if (data.user.role !== 'STUDENT') {
          setError('Seuls les comptes étudiants peuvent se connecter sur l\'application mobile.');
          setLoading(false);
          return false;
        }

        await SecureStore.setItemAsync('auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setLoading(false);
        return true;
      }

      setError('Erreur inattendue.');
      setLoading(false);
      return false;
    } catch (e) {
      console.error(e);
      setError('Erreur réseau ou serveur.');
      setLoading(false);
      return false;
    }
  };

  const fetchStudentProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_ENDPOINTS.me}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error('Failed to fetch profile', e);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
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
