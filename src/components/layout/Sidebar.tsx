import React from 'react';
import { SparklesIcon, ArrowLeftOnRectangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { SidebarItem } from './SidebarItem';
import { WorkspaceSelector } from './WorkspaceSelector';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  end?: boolean;
}

interface NavCategory {
  title?: string;
  items: NavItem[];
}

interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  navCategories: NavCategory[];
  userName?: string;
  userRole?: string;
  onLogout: () => void;
  commerceName?: string;
  commerceInitials?: string;
}

export function Sidebar({
  isCollapsed,
  isMobileOpen = false,
  onMobileClose,
  navCategories,
  userName,
  userRole,
  onLogout,
  commerceName = 'Agendai HQ',
  commerceInitials = 'HQ',
}: SidebarProps) {
  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      )}

      <aside
        id="sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-background border-r border-border flex flex-col h-full transition-all duration-300',
          isCollapsed ? 'w-20' : 'w-64',
          'max-lg:shadow-2xl',
          isMobileOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'
        )}
      >
        <div
          className={cn(
            'p-4 lg:p-6 flex items-center transition-all duration-300',
            isCollapsed ? 'justify-center px-2' : 'justify-between'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 flex-shrink-0">
              <SparklesIcon className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-extrabold tracking-tight text-foreground">Agendai</span>
            )}
          </div>
          {isMobileOpen && onMobileClose && (
            <button
              type="button"
              onClick={onMobileClose}
              className="lg:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground"
              aria-label="Fechar menu"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        <WorkspaceSelector
          isCollapsed={isCollapsed}
          name={commerceName}
          initials={commerceInitials}
          plan="Professional Plan"
        />

        <nav
          className={cn(
            'flex-1 px-3 space-y-6 [&::-webkit-scrollbar]:hidden',
            isCollapsed ? 'overflow-visible' : 'overflow-y-auto'
          )}
        >
          {navCategories.map((category, idx) => (
            <div key={idx} className="space-y-1">
              {category.title && !isCollapsed && (
                <p className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {category.title}
                </p>
              )}
              {category.title && isCollapsed && <div className="h-px bg-border my-4 mx-2" />}

              <div className="space-y-0.5">
                {category.items.map((item) => (
                  <div key={item.to} onClick={onMobileClose}>
                    <SidebarItem
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                      isCollapsed={isCollapsed}
                      end={item.end}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <div
            className={cn(
              'flex items-center gap-3 px-2 py-1 rounded-xl hover:bg-accent transition-colors',
              isCollapsed && 'justify-center px-0'
            )}
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
              {userName?.substring(0, 2).toUpperCase() || 'LP'}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold truncate text-foreground">{userName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{userRole}</p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title="Sair"
                >
                  <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
