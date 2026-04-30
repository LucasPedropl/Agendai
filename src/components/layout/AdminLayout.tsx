import React, { useState, useEffect } from 'react';
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
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import { IconLoader2 } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchApi } from '@/lib/api';
import CadastroComercioPage from '@/app/(public)/cadastro-comercio/page';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { motion, AnimatePresence } from 'motion/react';
import { Modal } from '@/components/ui/modal';
import { AppointmentForm } from '@/features/agenda/components/AppointmentForm';

import { cn } from '@/lib/utils';

/**
 * AdminLayout (Smart Component)
 * Orchestrates the application shell, authentication state, and commerce verification.
 */
export function AdminLayout() {
  const { logout, user, token, userType } = useAuth();
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
  const [hasCommerce, setHasCommerce] = useState<boolean | null>(null);
  const [isLoadingCommerce, setIsLoadingCommerce] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  const roleLabel = userType === 'estabelecimento' ? 'Administrador' : (userType as string) === 'profissional' ? 'Profissional' : 'Estabelecimento';
  const isProfissional = userType === 'profissional';

  // Sidebar Toggle
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('agendai-sidebar-collapsed', JSON.stringify(newState));
  };

  // Commerce verification logic
  useEffect(() => {
    const checkCommerce = async () => {
      if (isProfissional) {
        setHasCommerce(true);
        setIsLoadingCommerce(false);
        return;
      }
      try {
        const comercios = await fetchApi('/api/Comercios', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
          skipToast: true
        } as any);
        
        if (!comercios || (Array.isArray(comercios) && (comercios.length === 0 || (comercios.length === 1 && !comercios[0].nome)))) {
          setHasCommerce(false);
        } else {
          setHasCommerce(true);
        }
      } catch (err) {
        console.error("Erro ao verificar comércios:", err);
        setHasCommerce(false);
      } finally {
        setIsLoadingCommerce(false);
      }
    };

    if (token) checkCommerce();
    else setIsLoadingCommerce(false);
  }, [token, userType, isProfissional]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Navigation configuration
  const navCategories = [
    {
      items: [
        { to: '/estabelecimento/dashboard', icon: Squares2X2Icon, label: 'Dashboard' },
        { to: '/estabelecimento/agenda', icon: CalendarIcon, label: 'Agenda' },
        { to: '/estabelecimento/historico', icon: ClockIcon, label: 'Histórico' },
      ]
    },
    {
      title: 'GERENCIAMENTO',
      items: [
        { to: '/estabelecimento/servicos', icon: BriefcaseIcon, label: 'Serviços' },
        { to: '/estabelecimento/profissionais', icon: UsersIcon, label: 'Profissionais' },
        { to: '/estabelecimento/clientes', icon: UserIcon, label: 'Clientes' },
        ...(!isProfissional ? [{ to: '/estabelecimento/config-estabelecimento', icon: BuildingStorefrontIcon, label: 'Config. Estabelecimento' }] : []),
      ]
    },
    ...(!isProfissional ? [
      {
        title: 'FINANCEIRO',
        items: [{ to: '/estabelecimento/financeiro', icon: ChartBarIcon, label: 'Gestão Financeira' }]
      }
    ] : []),
    {
      title: 'OUTROS',
      items: [
        { to: '/estabelecimento/whatsapp', icon: ChatBubbleBottomCenterTextIcon, label: 'WhatsApp' },
        { to: '/estabelecimento/config', icon: Cog6ToothIcon, label: 'Configurações' },
      ]
    }
  ];

  const currentPathLabel = navCategories
    .flatMap(cat => cat.items)
    .find(item => location.pathname.includes(item.to))?.label || "Dashboard";

  if (isLoadingCommerce) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden">
      <Sidebar 
        isCollapsed={isCollapsed}
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

        {/* Profile Dropdown Overlay */}
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
                  onClick={() => { navigate('/estabelecimento/config'); setIsProfileOpen(false); }}
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
          "flex-1 overflow-y-auto bg-background/50",
          hasCommerce === false && "blur-sm pointer-events-none select-none"
        )}>
          <div className="p-6 md:p-10 max-w-7xl mx-auto">
            {hasCommerce === true && <Outlet />}
          </div>
        </main>
      </div>

      {/* Blocking Overlay for Commerce Setup */}
      {hasCommerce === false && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/40 backdrop-blur-md">
          <div className="bg-background border border-border p-8 rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <CadastroComercioPage onSuccess={() => setHasCommerce(true)} />
          </div>
        </div>
      )}
      {/* Global Appointment Modal */}
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
