import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Squares2X2Icon, 
  CalendarIcon, 
  ClockIcon, 
  BriefcaseIcon, 
  UsersIcon, 
  UserIcon, 
  BuildingStorefrontIcon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  ChatBubbleBottomCenterTextIcon,
  PuzzlePieceIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import { PageLoader } from '@/components/ui/page-loader';
import {
  Squares2X2Icon as MobileDashboardIcon,
  CalendarIcon as MobileCalendarIcon,
  ClockIcon as MobileClockIcon,
  Cog6ToothIcon as MobileConfigIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { ComercioProvider, useComercioContext } from '@/contexts/ComercioContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  canAccessRoute,
  getDashboardPath,
  resolveUserTypeFromAuth,
} from '@/lib/apiHelpers';
import CadastroComercioPage from '@/app/(public)/cadastro-comercio/page';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { motion, AnimatePresence } from 'motion/react';
import { Modal } from '@/components/ui/modal';
import { AppointmentForm } from '@/features/agenda/components/AppointmentForm';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import {
  buildComercioHistoricoPath,
  fetchComercioUsuariosList,
  getHistoricoPeriodoAtual,
  normalizeApiList,
} from '@/lib/apiHelpers';
import { queryKeys } from '@/lib/queryKeys';

function AdminLayoutShell() {
  const { logout, user, token, userType } = useAuth();
  const { comercioId, isLoading: isLoadingCommerce, hasCommerce, reload, error: comercioError } = useComercioContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agendai-sidebar-collapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const roleLabel = userType === 'estabelecimento' ? 'Administrador' : (userType as string) === 'profissional' ? 'Profissional' : 'Estabelecimento';
  const isProfissional = userType === 'profissional';

  useEffect(() => {
    if (!token) return;
    const tokenUserType = resolveUserTypeFromAuth(token);
    const requiredType: ('estabelecimento' | 'profissional')[] = isProfissional
      ? ['profissional']
      : ['estabelecimento'];
    if (!canAccessRoute(tokenUserType, requiredType)) {
      navigate(getDashboardPath(tokenUserType), { replace: true });
    }
  }, [token, isProfissional, navigate]);

  useEffect(() => {
    if (!comercioId) return;
    const periodo = getHistoricoPeriodoAtual();
    void queryClient.prefetchQuery({
      queryKey: queryKeys.agendaComercio(comercioId),
      queryFn: async () => {
        const data = await fetchApi(`/api/Agenda/Comercio/${comercioId}`, { skipToast: true } as RequestInit);
        return normalizeApiList(data, ['Agenda Vazia']);
      },
    });
    void queryClient.prefetchQuery({
      queryKey: queryKeys.historicoComercio(comercioId, periodo, '', ''),
      queryFn: async () => {
        const path = buildComercioHistoricoPath({
          comercioId,
          periodo,
        });
        const data = await fetchApi(path, { skipToast: true } as RequestInit);
        return normalizeApiList(data, ['Histórico Vazio']);
      },
    });
    void queryClient.prefetchQuery({
      queryKey: queryKeys.servicos(comercioId),
      queryFn: async () => {
        const data = await fetchApi(`/api/Servicos/Todos/${comercioId}`, { skipToast: true } as RequestInit);
        return normalizeApiList(data);
      },
    });
    void queryClient.prefetchQuery({
      queryKey: queryKeys.comercioUsuarios('Clientes', comercioId),
      queryFn: () => fetchComercioUsuariosList(fetchApi, 'Clientes', comercioId),
    });
    void queryClient.prefetchQuery({
      queryKey: queryKeys.comercioUsuarios('Profissionais', comercioId),
      queryFn: () => fetchComercioUsuariosList(fetchApi, 'Profissionais', comercioId),
    });
  }, [comercioId, queryClient]);

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileSidebarOpen((prev) => !prev);
      return;
    }
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('agendai-sidebar-collapsed', JSON.stringify(newState));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const basePath = location.pathname.startsWith('/profissional') ? '/profissional' : '/estabelecimento';

  const navCategories = [
    {
      items: [
        { to: `${basePath}/dashboard`, icon: Squares2X2Icon, label: 'Dashboard', end: true },
        { to: `${basePath}/agenda`, icon: CalendarIcon, label: 'Agenda' },
        { to: `${basePath}/historico`, icon: ClockIcon, label: 'Histórico' },
      ]
    },
    {
      title: 'GERENCIAMENTO',
      items: [
        { to: `${basePath}/servicos`, icon: BriefcaseIcon, label: 'Serviços' },
        ...(!isProfissional ? [{ to: `${basePath}/profissionais`, icon: UsersIcon, label: 'Profissionais' }] : []),
        { to: `${basePath}/clientes`, icon: UserIcon, label: 'Clientes' },
        ...(!isProfissional ? [{ to: `${basePath}/config-estabelecimento`, icon: BuildingStorefrontIcon, label: 'Config. Estabelecimento' }] : []),
      ]
    },
    ...(!isProfissional ? [
      {
        title: 'FINANCEIRO',
        items: [{ to: `${basePath}/financeiro`, icon: ChartBarIcon, label: 'Gestão Financeira' }]
      },
      {
        title: 'OUTROS',
        items: [
          { to: `${basePath}/integracoes`, icon: PuzzlePieceIcon, label: 'Integrações Bixs' },
          { to: `${basePath}/whatsapp`, icon: ChatBubbleBottomCenterTextIcon, label: 'WhatsApp' },
          { to: `${basePath}/config`, icon: Cog6ToothIcon, label: 'Configurações' },
        ]
      }
    ] : [
      {
        title: 'OUTROS',
        items: [
          { to: `${basePath}/config`, icon: Cog6ToothIcon, label: 'Configurações' },
        ]
      }
    ])
  ];

  const currentPathLabel = navCategories
    .flatMap(cat => cat.items)
    .find(item => location.pathname === item.to || location.pathname.startsWith(item.to + '/'))?.label || "Dashboard";

  const mobileNavItems = [
    { to: `${basePath}/dashboard`, icon: MobileDashboardIcon, label: 'Início' },
    { to: `${basePath}/agenda`, icon: MobileCalendarIcon, label: 'Agenda' },
    { to: `${basePath}/historico`, icon: MobileClockIcon, label: 'Histórico' },
    { to: `${basePath}/config`, icon: MobileConfigIcon, label: 'Config' },
  ];

  if (comercioError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-4">
          <p className="text-destructive font-medium">{comercioError}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Sair e tentar outro login
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingCommerce) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <PageLoader label="Carregando workspace..." />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden">
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
        navCategories={navCategories}
        userName={user?.nome}
        userRole={roleLabel}
        onLogout={handleLogout}
        commerceName="Agendai HQ"
      />

      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 overflow-hidden",
        isCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <Topbar 
          onToggleSidebar={toggleSidebar}
          theme={theme as 'light' | 'dark'}
          onToggleTheme={toggleTheme}
          userName={user?.nome}
          userInitials={user?.nome?.charAt(0) || 'A'}
          isProfileOpen={isProfileOpen}
          onToggleProfile={() => setIsProfileOpen(!isProfileOpen)}
          breadcrumb={currentPathLabel}
          onNewAppointment={() => setIsAppointmentModalOpen(true)}
        />

        <AnimatePresence>
          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-8 top-16 mt-2 w-56 origin-top-right rounded-xl bg-background border border-border p-1 shadow-2xl z-50 overflow-hidden"
              >
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-xs font-bold truncate text-foreground">{user?.nome}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{roleLabel}</p>
                </div>
                <button 
                  onClick={() => { navigate(`${basePath}/config`); setIsProfileOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground/70 hover:bg-accent rounded-lg transition-colors text-left"
                >
                  <UserIcon className="w-4 h-4" />
                  Meu Perfil
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                >
                  <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                  Sair do Sistema
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className={cn(
          'flex-1 overflow-y-auto bg-background/50 pb-20 lg:pb-0',
          !hasCommerce && userType === 'estabelecimento' && 'blur-sm pointer-events-none select-none'
        )}>
          <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto">
            {(hasCommerce || isProfissional) && <Outlet />}
          </div>
        </main>
      </div>

      {!hasCommerce && userType === 'estabelecimento' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/40 backdrop-blur-md">
          <div className="bg-background border border-border p-6 sm:p-8 rounded-2xl shadow-2xl max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <CadastroComercioPage onSuccess={() => void reload()} />
          </div>
        </div>
      )}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t border-border bg-background/90 backdrop-blur-lg lg:hidden">
        {mobileNavItems.map((item) => (
          <button
            key={item.to}
            type="button"
            onClick={() => navigate(item.to)}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-tighter transition-colors',
              location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </button>
        ))}
      </nav>

      <Modal
        isOpen={isAppointmentModalOpen} 
        onClose={() => setIsAppointmentModalOpen(false)} 
        title="Novo Agendamento"
      >
        <AppointmentForm 
          onSuccess={() => setIsAppointmentModalOpen(false)} 
          onCancel={() => setIsAppointmentModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

export function AdminLayout() {
  return (
    <ComercioProvider>
      <AdminLayoutShell />
    </ComercioProvider>
  );
}
