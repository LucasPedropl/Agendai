import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthState, User } from '@/types';
import { apiPermissaoToUserType, getRoleFromToken } from '@/lib/apiHelpers';

interface AuthContextType extends AuthState {
  login: (user: User, token: string, userType: 'cliente' | 'estabelecimento' | 'profissional') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeStoredAuth(raw: string): AuthState {
  try {
    const parsed = JSON.parse(raw) as AuthState;
    if (parsed.token) {
      const roleFromToken = getRoleFromToken(parsed.token);
      if (roleFromToken) {
        parsed.userType = apiPermissaoToUserType(roleFromToken);
      }
    }
    return parsed;
  } catch (e) {
    console.error('Failed to parse stored auth', e);
    return {
      isAuthenticated: false,
      user: null,
      token: null,
      userType: null,
    };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const storedAuth = localStorage.getItem('agendaAi_auth');
    if (storedAuth) {
      return normalizeStoredAuth(storedAuth);
    }
    return {
      isAuthenticated: false,
      user: null,
      token: null,
      userType: null,
    };
  });

  const login = (user: User, token: string, userType: 'cliente' | 'estabelecimento' | 'profissional') => {
    const newState = { isAuthenticated: true, user, token, userType };
    setAuthState(newState);
    localStorage.setItem('agendaAi_auth', JSON.stringify(newState));
  };

  const logout = useCallback(() => {
    const newState = { isAuthenticated: false, user: null, token: null, userType: null };
    setAuthState(newState);
    localStorage.removeItem('agendaAi_auth');
    localStorage.removeItem('token');
  }, []);

  useEffect(() => {
    const onSessionExpired = () => {
      logout();
      window.dispatchEvent(
        new CustomEvent('global-toast', {
          detail: {
            type: 'error',
            message: 'Sua sessão expirou. Faça login novamente para continuar.',
          },
        })
      );
    };
    window.addEventListener('agendaai:session-expired', onSessionExpired);
    return () => window.removeEventListener('agendaai:session-expired', onSessionExpired);
  }, [logout]);

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
