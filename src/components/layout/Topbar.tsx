import React from 'react';
import { 
  Bars3Icon, 
  ChevronRightIcon, 
  SunIcon, 
  MoonIcon, 
  BellIcon, 
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
}

/**
 * Topbar Component (Dumb)
 * Renders the top navigation bar.
 */
export function Topbar({
  onToggleSidebar,
  theme,
  onToggleTheme,
  userName,
  userInitials,
  isProfileOpen,
  onToggleProfile,
  breadcrumb = "Dashboard",
  onNewAppointment
}: TopbarProps) {
  return (
    <header className="h-16 border-b border-border px-8 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-40">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110 active:scale-90"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="hover:text-foreground cursor-pointer transition-colors">Workspace</span>
          <ChevronRightIcon className="w-3 h-3" />
          <span className="text-foreground font-bold">{breadcrumb}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button 
          onClick={onToggleTheme}
          className="p-2.5 rounded-xl border border-border hover:bg-accent transition-all text-muted-foreground group"
          title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
        >
          {theme === 'light' ? (
            <SunIcon className="w-5 h-5 group-hover:rotate-45 transition-transform" />
          ) : (
            <MoonIcon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
          )}
        </button>
        
        {/* Notifications */}
        <button className="p-2.5 rounded-xl border border-border hover:bg-accent transition-all text-muted-foreground relative group">
          <BellIcon className="w-5 h-5 group-hover:shake transition-all" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-background"></span>
        </button>

        <div className="h-6 w-px bg-border mx-2 hidden md:block"></div>
        
        {/* Quick Action Button */}
        <button 
          onClick={onNewAppointment}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
        >
          <PlusIcon className="w-4 h-4" />
          <span className="hidden md:inline">Novo Agendamento</span>
        </button>

        {/* Profile Trigger */}
        <div className="relative">
          <button 
            onClick={onToggleProfile}
            className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20 hover:scale-105 transition-all"
          >
            {userInitials || 'A'}
          </button>
        </div>
      </div>
    </header>
  );
}
