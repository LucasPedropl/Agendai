/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';

import LandingPage from '@/app/(public)/page';
import LoginSelectionPage from '@/app/(public)/login-selection/page';
import LoginPage from '@/app/(public)/login/page';
import CadastroPage from '@/app/(public)/cadastro/page';
import AtivarContaPage from '@/app/(public)/ativar-conta/page';
import ClientDashboardPage from '@/app/(client)/agendamentos/page';
import ClientHistoryPage from '@/app/(client)/historico/page';
import ClientProfilePage from '@/app/(client)/perfil/page';
import ClientFinancasPage from '@/app/(client)/financas/page';
import ClientPagamentosPage from '@/app/(client)/pagamentos/page';
import ClientAvaliacoesPage from '@/app/(client)/avaliacoes/page';
import ClientConfiguracoesPage from '@/app/(client)/configuracoes/page';
import AdminDashboardPage from '@/app/(admin)/dashboard/page';
import AdminAgendaPage from '@/app/(admin)/agenda/page';
import AdminHistoryPage from '@/app/(admin)/historico/page';
import AdminServicosPage from '@/app/(admin)/servicos/page';
import AdminProfissionaisPage from '@/app/(admin)/profissionais/page';
import AdminClientesPage from '@/app/(admin)/clientes/page';
import AdminEstablishmentConfigPage from '@/app/(admin)/config-estabelecimento/page';
import AdminFinanceiroPage from '@/app/(admin)/financeiro/page';
import AdminWhatsAppPage from '@/app/(admin)/whatsapp/page';
import AdminConfigPage from '@/app/(admin)/config/page';
import AgendarPage from '@/app/(client)/agendar/page';
import { ToastProvider } from '@/contexts/ToastContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import {
  resolveUserTypeFromAuth,
  getDashboardPath,
  canAccessRoute,
  type AppUserType,
} from '@/lib/apiHelpers';

function ProtectedRoute({
  children,
  allowedType,
}: {
  children: React.ReactNode;
  allowedType: AppUserType | AppUserType[];
}) {
  const { isAuthenticated, token } = useAuth();

  if (!isAuthenticated || !token) {
    const loginType = Array.isArray(allowedType) ? allowedType[0] : allowedType;
    return <Navigate to={`/login?type=${loginType}`} replace />;
  }

  const tokenUserType = resolveUserTypeFromAuth(token);

  if (!canAccessRoute(tokenUserType, allowedType)) {
    return <Navigate to={getDashboardPath(tokenUserType)} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, token } = useAuth();
  
  const getRedirectPath = () => {
    if (!isAuthenticated || !token) return '/login-selection';
    return getDashboardPath(resolveUserTypeFromAuth(token));
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Navigate to={getRedirectPath()} replace />} />
          <Route path="/login-selection" element={<LoginSelectionPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro/:type/*" element={<CadastroPage />} />
          <Route path="/ativar-conta" element={<AtivarContaPage />} />
        </Route>

        {/* Client Routes */}
        <Route path="/app" element={<ProtectedRoute allowedType="cliente"><ClientLayout /></ProtectedRoute>}>
          <Route index element={<AgendarPage />} />
          <Route path="agendamentos" element={<ClientDashboardPage />} />
          <Route path="historico" element={<ClientHistoryPage />} />
          <Route path="perfil" element={<ClientProfilePage />} />
          <Route path="financas" element={<ClientFinancasPage />} />
          <Route path="pagamentos" element={<ClientPagamentosPage />} />
          <Route path="avaliacoes" element={<ClientAvaliacoesPage />} />
          <Route path="configuracoes" element={<ClientConfiguracoesPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/estabelecimento" element={<ProtectedRoute allowedType="estabelecimento"><AdminLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="agenda" element={<AdminAgendaPage />} />
          <Route path="historico" element={<AdminHistoryPage />} />
          <Route path="servicos" element={<AdminServicosPage />} />
          <Route path="profissionais" element={<AdminProfissionaisPage />} />
          <Route path="clientes" element={<AdminClientesPage />} />
          <Route path="config-estabelecimento" element={<AdminEstablishmentConfigPage />} />
          <Route path="financeiro" element={<AdminFinanceiroPage />} />
          <Route path="whatsapp" element={<AdminWhatsAppPage />} />
          <Route path="config" element={<AdminConfigPage />} />
        </Route>

        {/* Professional Routes */}
        <Route path="/profissional" element={<ProtectedRoute allowedType="profissional"><AdminLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="agenda" element={<AdminAgendaPage />} />
          <Route path="historico" element={<AdminHistoryPage />} />
          <Route path="servicos" element={<AdminServicosPage />} />
          <Route path="clientes" element={<AdminClientesPage />} />
          <Route path="config" element={<AdminConfigPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
