import React from 'react';
import { SparklesIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { SidebarItem } from './SidebarItem';
import { WorkspaceSelector } from './WorkspaceSelector';

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

interface NavCategory {
  title?: string;
  items: NavItem[];
}

interface SidebarProps {
  isCollapsed: boolean;
  navCategories: NavCategory[];
  userName?: string;
  userRole?: string;
  onLogout: () => void;
  commerceName?: string;
  commerceInitials?: string;
}

/**
 * Sidebar Component (Dumb)
 * Renders the full navigation sidebar.
 */
export function Sidebar({ 
  isCollapsed, 
  navCategories, 
  userName, 
  userRole, 
  onLogout,
  commerceName = "Agendai HQ",
  commerceInitials = "HQ"
}: SidebarProps) {
  return (
    <aside 
      id="sidebar" 
      className={cn(
        "fixed inset-y-0 left-0 z-50 bg-background border-r border-border flex flex-col h-full transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand */}
      <div className={cn("p-6 flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 flex-shrink-0 transition-transform hover:scale-105">
            <SparklesIcon className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-extrabold tracking-tight text-foreground transition-all duration-300">
              Agendai
            </span>
          )}
        </div>
      </div>

      {/* Workspace Selector */}
      <WorkspaceSelector 
        isCollapsed={isCollapsed} 
        name={commerceName} 
        initials={commerceInitials}
        plan="Professional Plan"
      />

      {/* Navigation */}
      <nav className={cn(
        "flex-1 px-3 space-y-6 [&::-webkit-scrollbar]:hidden", 
        isCollapsed ? "overflow-visible" : "overflow-y-auto"
      )}>
        {navCategories.map((category, idx) => (
          <div key={idx} className="space-y-1">
            {category.title && !isCollapsed && (
              <p className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {category.title}
              </p>
            )}
            {category.title && isCollapsed && (
              <div className="h-px bg-border my-4 mx-2" />
            )}
            
            <div className="space-y-0.5">
              {category.items.map((item) => (
                <SidebarItem 
                  key={item.to} 
                  to={item.to} 
                  icon={item.icon} 
                  label={item.label} 
                  isCollapsed={isCollapsed} 
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Content */}
      <div className="p-4 border-t border-border mt-auto">
        <div className={cn("flex items-center gap-3 px-2 py-1 rounded-xl hover:bg-accent transition-colors", isCollapsed && "justify-center px-0")}>
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
            {userName?.substring(0, 2).toUpperCase() || 'LP'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate text-foreground">{userName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{userRole}</p>
            </div>
          )}
          {!isCollapsed && (
            <button 
              onClick={onLogout}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Sair"
            >
              <ArrowLeftOnRectangleIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
