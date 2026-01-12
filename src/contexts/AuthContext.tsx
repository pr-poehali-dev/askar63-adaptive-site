import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  username: string;
  full_name: string;
  is_admin: boolean;
  avatar_url?: string;
  bio?: string;
  followers_count?: number;
  following_count?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (phone: string, password: string, full_name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('askar63_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (phone: string, password: string) => {
    try {
      const result = await api.login(phone, password);
      if (result.success) {
        setUser(result.user);
        localStorage.setItem('askar63_user', JSON.stringify(result.user));
        return { success: true };
      }
      return { success: false, error: result.error || 'Ошибка входа' };
    } catch (error) {
      return { success: false, error: 'Ошибка сети' };
    }
  };

  const register = async (phone: string, password: string, full_name: string) => {
    try {
      const result = await api.register(phone, password, full_name);
      if (result.success) {
        setUser(result.user);
        localStorage.setItem('askar63_user', JSON.stringify(result.user));
        return { success: true };
      }
      return { success: false, error: result.error || 'Ошибка регистрации' };
    } catch (error) {
      return { success: false, error: 'Ошибка сети' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('askar63_user');
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('askar63_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
