import React from 'react';
import { NavLink } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  isCollapsed: boolean;
}

/**
 * SidebarItem Component (Dumb)
 * Renders a single navigation link for the sidebar.
 */
export function SidebarItem({ to, icon: Icon, label, isCollapsed }: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative",
          isActive 
            ? "sidebar-item-active shadow-sm" 
            : "text-muted-foreground hover:bg-accent hover:text-foreground hover:scale-[1.02] active:scale-95",
          isCollapsed && "justify-center px-0 hover:scale-110"
        )
      }
    >
      <Icon className={cn("w-5 h-5 flex-shrink-0", isCollapsed ? "" : "")} />
      
      {!isCollapsed && (
        <span className="text-sm font-medium transition-opacity duration-300">
          {label}
        </span>
      )}

      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-full ml-4 invisible group-hover:visible opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-200 z-[100]">
          <div className="relative flex items-center">
            <div className="absolute -left-1 h-2 w-2 rotate-45 bg-slate-900 dark:bg-slate-800"></div>
            <div className="rounded-md bg-slate-900 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white shadow-xl whitespace-nowrap">
              {label}
            </div>
          </div>
        </div>
      )}
    </NavLink>
  );
}
