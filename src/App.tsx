/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';

import LandingPage from '@/app/(public)/page';
import LoginSelectionPage from '@/app/(public)/login-selection/page';
import LoginPage from '@/app/(public)/login/page';
import CadastroPage from '@/app/(public)/cadastro/page';
import ClientDashboardPage from '@/app/(client)/agendamentos/page';
import ClientHistoryPage from '@/app/(client)/historico/page';
import ClientProfilePage from '@/app/(client)/perfil/page';
import ClientFinancasPage from '@/app/(client)/financas/page';
import ClientPagamentosPage from '@/app/(client)/pagamentos/page';
import ClientNotificacoesPage from '@/app/(client)/notificacoes/page';
import ClientAvaliacoesPage from '@/app/(client)/avaliacoes/page';
import ClientConfiguracoesPage from '@/app/(client)/configuracoes/page';
import AdminDashboardPage from '@/app/(admin)/dashboard/page';
import AdminAgendaPage from '@/app/(admin)/agenda/page';
import AdminHistoryPage from '@/app/(admin)/historico/page';
import AdminServicosPage from '@/app/(admin)/servicos/page';
import AdminProductsPage from '@/app/(admin)/produtos/page';
import AdminProfissionaisPage from '@/app/(admin)/profissionais/page';
import AdminClientesPage from '@/app/(admin)/clientes/page';
import AdminEstablishmentConfigPage from '@/app/(admin)/config-estabelecimento/page';
import AdminReceitasPage from '@/app/(admin)/receitas/page';
import AdminDespesasPage from '@/app/(admin)/despesas/page';
import AdminRevenueVsExpensePage from '@/app/(admin)/receita-vs-despesa/page';
import AdminRelatoriosPage from '@/app/(admin)/relatorios/page';
import AdminConfigPage from '@/app/(admin)/config/page';
import AgendarPage from '@/app/(client)/agendar/page';

function ProtectedRoute({ children, allowedType }: { children: React.ReactNode, allowedType: 'cliente' | 'estabelecimento' }) {
  const { isAuthenticated, userType } = useAuth();
  
  // Bypass for demo purposes as requested by user
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Navigate to="/login-selection" replace />} />
            <Route path="/login-selection" element={<LoginSelectionPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro/:type" element={<CadastroPage />} />
          </Route>

          {/* Client Routes */}
          <Route path="/app" element={<ProtectedRoute allowedType="cliente"><ClientLayout /></ProtectedRoute>}>
            <Route index element={<AgendarPage />} />
            <Route path="agendamentos" element={<ClientDashboardPage />} />
            <Route path="historico" element={<ClientHistoryPage />} />
            <Route path="perfil" element={<ClientProfilePage />} />
            <Route path="financas" element={<ClientFinancasPage />} />
            <Route path="pagamentos" element={<ClientPagamentosPage />} />
            <Route path="notificacoes" element={<ClientNotificacoesPage />} />
            <Route path="avaliacoes" element={<ClientAvaliacoesPage />} />
            <Route path="configuracoes" element={<ClientConfiguracoesPage />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/estabelecimento" element={<ProtectedRoute allowedType="estabelecimento"><AdminLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="agenda" element={<AdminAgendaPage />} />
            <Route path="historico" element={<AdminHistoryPage />} />
            <Route path="servicos" element={<AdminServicosPage />} />
            <Route path="produtos" element={<AdminProductsPage />} />
            <Route path="profissionais" element={<AdminProfissionaisPage />} />
            <Route path="clientes" element={<AdminClientesPage />} />
            <Route path="config-estabelecimento" element={<AdminEstablishmentConfigPage />} />
            <Route path="receitas" element={<AdminReceitasPage />} />
            <Route path="despesas" element={<AdminDespesasPage />} />
            <Route path="receita-vs-despesa" element={<AdminRevenueVsExpensePage />} />
            <Route path="relatorios" element={<AdminRelatoriosPage />} />
            <Route path="config" element={<AdminConfigPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
