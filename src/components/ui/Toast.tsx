import React, { useEffect, useState, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

const toastStyles: Record<ToastType, { container: string; icon: string; progress: string }> = {
  success: {
    container: 'bg-emerald-600 border-emerald-700 text-white shadow-emerald-900/20',
    icon: 'text-white',
    progress: 'bg-emerald-300',
  },
  error: {
    container: 'bg-destructive/10 border-destructive/50 text-destructive',
    icon: 'text-destructive',
    progress: 'bg-destructive',
  },
  warning: {
    container: 'bg-amber-500/10 border-amber-500/50 text-amber-900 dark:text-amber-100',
    icon: 'text-amber-600 dark:text-amber-400',
    progress: 'bg-amber-500',
  },
  info: {
    container: 'bg-primary/10 border-primary/50 text-foreground',
    icon: 'text-primary',
    progress: 'bg-primary',
  },
};

export function Toast({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(toast.duration || 5000);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const startAnimation = () => {
      startTimeRef.current = Date.now();
      const tick = () => {
        if (!isPaused) {
          const elapsed = Date.now() - startTimeRef.current;
          const newRemaining = remainingTimeRef.current - elapsed;

          if (newRemaining <= 0) {
            onRemove(toast.id);
          } else {
            setProgress((newRemaining / (toast.duration || 5000)) * 100);
            animationRef.current = requestAnimationFrame(tick);
          }
        }
      };
      animationRef.current = requestAnimationFrame(tick);
    };

    if (!isPaused) startAnimation();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (!isPaused) {
        remainingTimeRef.current -= Date.now() - startTimeRef.current;
      }
    };
  }, [isPaused, onRemove, toast.id, toast.duration]);

  const styles = toastStyles[toast.type];

  const Icon = () => {
    const cls = cn('w-5 h-5', styles.icon);
    switch (toast.type) {
      case 'success': return <CheckCircle className={cls} />;
      case 'error': return <AlertCircle className={cls} />;
      case 'warning': return <AlertTriangle className={cls} />;
      case 'info': return <Info className={cls} />;
      default: return null;
    }
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-between p-4 mb-2 border-l-4 rounded-xl shadow-lg pointer-events-auto min-w-[300px] max-w-sm overflow-hidden backdrop-blur-md bg-background/95',
        styles.container
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onContextMenu={(e) => { e.preventDefault(); onRemove(toast.id); }}
    >
      <div className="flex items-start gap-3 relative z-10 w-full pr-6">
        <div className="mt-0.5"><Icon /></div>
        <span className="font-medium text-sm w-full break-words leading-relaxed">{toast.message}</span>
      </div>

      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="absolute top-3 right-3 text-current opacity-60 hover:opacity-100 z-10"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="absolute bottom-0 left-0 h-1 w-full bg-foreground/5">
        <div
          className={cn('h-full transition-all duration-75 ease-linear', styles.progress)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
