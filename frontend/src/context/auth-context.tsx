'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, authService, LoginInput, RegisterInput } from '@/services/auth.service';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginInput) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterInput) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check localStorage on mount
    try {
      const storedToken = localStorage.getItem('wholesalehub_token');
      const storedUser = localStorage.getItem('wholesalehub_user');
      if (storedToken && storedUser) {
        setAccessToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // Ignore localStorage errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials: LoginInput) => {
    setIsLoading(true);
    try {
      const res = await authService.login(credentials);
      if (res.success && res.data) {
        setUser(res.data.user);
        setAccessToken(res.data.tokens.accessToken);
        localStorage.setItem('wholesalehub_token', res.data.tokens.accessToken);
        localStorage.setItem('wholesalehub_refresh', res.data.tokens.refreshToken);
        localStorage.setItem('wholesalehub_user', JSON.stringify(res.data.user));
        return { success: true };
      }
      return { success: false, error: res.error?.message || 'Login failed' };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const res = await authService.register(data);
      if (res.success && res.data) {
        setUser(res.data.user);
        setAccessToken(res.data.tokens.accessToken);
        localStorage.setItem('wholesalehub_token', res.data.tokens.accessToken);
        localStorage.setItem('wholesalehub_refresh', res.data.tokens.refreshToken);
        localStorage.setItem('wholesalehub_user', JSON.stringify(res.data.user));
        return { success: true };
      }
      return { success: false, error: res.error?.message || 'Registration failed' };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (accessToken) {
      try {
        await authService.logout(accessToken);
      } catch {
        // Continue cleanup
      }
    }
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('wholesalehub_token');
    localStorage.removeItem('wholesalehub_refresh');
    localStorage.removeItem('wholesalehub_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
