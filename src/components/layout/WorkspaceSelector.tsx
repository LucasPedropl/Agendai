import React from 'react';
import { ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface WorkspaceSelectorProps {
  isCollapsed: boolean;
  name: string;
  plan?: string;
  initials: string;
}

/**
 * WorkspaceSelector Component (Dumb)
 * Renders the workspace switcher button in the sidebar.
 */
export function WorkspaceSelector({ isCollapsed, name, plan, initials }: WorkspaceSelectorProps) {
  return (
    <div className="px-4 mb-6">
      <button 
        className={cn(
          "w-full flex items-center justify-between p-2 rounded-lg border border-border hover:bg-accent transition-all duration-200 group",
          isCollapsed && "justify-center p-2"
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0 shadow-sm border border-primary/20">
            {initials}
          </div>
          {!isCollapsed && (
            <div className="text-left overflow-hidden">
              <p className="text-xs font-bold truncate text-foreground">{name}</p>
              {plan && <p className="text-[10px] text-muted-foreground font-medium truncate">{plan}</p>}
            </div>
          )}
        </div>
        {!isCollapsed && (
          <ChevronUpDownIcon className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors ml-2" />
        )}
      </button>
    </div>
  );
}
