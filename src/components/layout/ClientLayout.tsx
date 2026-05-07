import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon, 
  BellIcon,
  CreditCardIcon,
  StarIcon,
  Cog6ToothIcon,
  WalletIcon,
  ClipboardDocumentListIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * ClientLayout (Smart Component)
 * Orchestrates the application shell for the end-user (client).
 */
export function ClientLayout() {
  const { logout, user } = useAuth();
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

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('agendai-sidebar-collapsed', JSON.stringify(newState));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navCategories = [
    {
      title: 'MEU ESPAÇO',
      items: [
        { to: '/app', icon: CalendarIcon, label: 'Agendar Serviço', end: true },
        { to: '/app/agendamentos', icon: ClipboardDocumentListIcon, label: 'Meus Agendamentos' },
        { to: '/app/historico', icon: ClockIcon, label: 'Meu Histórico' },
      ]
    },
    {
      title: 'FINANCEIRO',
      items: [
        { to: '/app/financas', icon: WalletIcon, label: 'Minhas Finanças' },
        { to: '/app/pagamentos', icon: CreditCardIcon, label: 'Formas de Pagamento' },
      ]
    },
    {
      title: 'OUTROS',
      items: [
        { to: '/app/avaliacoes', icon: StarIcon, label: 'Minhas Avaliações' },
        { to: '/app/configuracoes', icon: Cog6ToothIcon, label: 'Configurações' },
      ]
    }
  ];

  const currentPathLabel = navCategories
    .flatMap(cat => cat.items)
    .find(item => location.pathname === item.to || location.pathname.startsWith(item.to + '/'))?.label || "Área do Cliente";

  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden">
      <Sidebar 
        isCollapsed={isCollapsed}
        navCategories={navCategories}
        userName={user?.nome}
        userRole="Cliente"
        onLogout={handleLogout}
        commerceName="Agendai"
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
          userInitials={user?.nome?.charAt(0) || 'C'}
          isProfileOpen={isProfileOpen}
          onToggleProfile={() => setIsProfileOpen(!isProfileOpen)}
          breadcrumb={currentPathLabel}
          // Client doesn't have "New Appointment" button in the Topbar like Admin,
          // but we can pass it if we want them to have a shortcut.
          onNewAppointment={() => navigate('/app')}
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
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Cliente</p>
                </div>
                <button 
                  onClick={() => { navigate('/app/perfil'); setIsProfileOpen(false); }}
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

        <main className="flex-1 overflow-y-auto bg-background/50">
          <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Preserved for Client UX) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t border-border bg-background/80 backdrop-blur-lg lg:hidden">
        {[
          { to: '/app', icon: CalendarIcon, label: 'Agendar' },
          { to: '/app/agendamentos', icon: ClipboardDocumentListIcon, label: 'Agenda' },
          { to: '/app/financas', icon: WalletIcon, label: 'Finanças' },
          { to: '/app/perfil', icon: UserIcon, label: 'Perfil' },
        ].map((item) => (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-tighter transition-colors",
              location.pathname === item.to ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
