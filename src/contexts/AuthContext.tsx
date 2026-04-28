import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthState, User } from '@/types';

interface AuthContextType extends AuthState {
  login: (user: User, token: string, userType: 'cliente' | 'estabelecimento' | 'profissional') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    userType: null,
  });

  useEffect(() => {
    const storedAuth = localStorage.getItem('agendaAi_auth');
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        setAuthState(parsed);
      } catch (e) {
        console.error('Failed to parse stored auth', e);
      }
    }
  }, []);

  const login = (user: User, token: string, userType: 'cliente' | 'estabelecimento' | 'profissional') => {
    const newState = { isAuthenticated: true, user, token, userType };
    setAuthState(newState);
    localStorage.setItem('agendaAi_auth', JSON.stringify(newState));
  };

  const logout = () => {
    const newState = { isAuthenticated: false, user: null, token: null, userType: null };
    setAuthState(newState);
    localStorage.removeItem('agendaAi_auth');
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
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
