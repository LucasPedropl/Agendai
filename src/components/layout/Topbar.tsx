import React from 'react';
import { 
  Bars3Icon, 
  ChevronRightIcon, 
  SunIcon, 
  MoonIcon, 
  PlusIcon 
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface TopbarProps {
  onToggleSidebar: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  userName?: string;
  userInitials?: string;
  isProfileOpen: boolean;
  onToggleProfile: () => void;
  breadcrumb?: string;
  onNewAppointment?: () => void;
  showNewAppointment?: boolean;
}

export function Topbar({
  onToggleSidebar,
  theme,
  onToggleTheme,
  userInitials,
  onToggleProfile,
  breadcrumb = 'Dashboard',
  onNewAppointment,
  showNewAppointment = true,
}: TopbarProps) {
  return (
    <header className="h-16 border-b border-border px-4 md:px-8 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-40">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all active:scale-95"
          aria-label="Alternar menu"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span>Workspace</span>
          <ChevronRightIcon className="w-3 h-3" />
          <span className="text-foreground font-bold">{breadcrumb}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-2.5 rounded-xl border border-border hover:bg-accent transition-all text-muted-foreground"
          title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
        >
          {theme === 'light' ? (
            <SunIcon className="w-5 h-5" />
          ) : (
            <MoonIcon className="w-5 h-5" />
          )}
        </button>

        {showNewAppointment && onNewAppointment && (
          <button
            type="button"
            onClick={onNewAppointment}
            className="bg-primary text-primary-foreground px-3 md:px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="hidden md:inline">Novo Agendamento</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleProfile}
          className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20 hover:scale-105 transition-all"
          aria-label="Menu do perfil"
        >
          {userInitials || 'A'}
        </button>
      </div>
    </header>
  );
}
