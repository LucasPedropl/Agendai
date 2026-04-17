import React, { useEffect, useState, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export function Toast({ toast, onRemove }: { toast: ToastMessage, onRemove: (id: string) => void }) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(toast.duration || 5000);
  const animationRef = useRef<number>();

  useEffect(() => {
    const startAnimation = () => {
      startTimeRef.current = Date.now();
      const tick = () => {
        if (!isPaused) {
          const now = Date.now();
          const elapsed = now - startTimeRef.current;
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

    if (!isPaused) {
      startAnimation();
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (!isPaused) {
        remainingTimeRef.current -= Date.now() - startTimeRef.current;
      }
    };
  }, [isPaused, onRemove, toast.id, toast.duration]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onRemove(toast.id);
  };

  const getColors = () => {
    switch (toast.type) {
      case 'success': return 'bg-green-50 border-green-500 text-green-900';
      case 'error': return 'bg-red-50 border-red-500 text-red-900';
      case 'warning': return 'bg-yellow-50 border-yellow-500 text-yellow-900';
      case 'info': return 'bg-blue-50 border-blue-500 text-blue-900';
      default: return 'bg-white border-gray-300 text-gray-800';
    }
  };

  const getProgressColor = () => {
    switch (toast.type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const Icon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info': return <Info className="w-5 h-5 text-blue-600" />;
      default: return null;
    }
  };

  return (
    <div
      className={`relative flex items-center justify-between p-4 mb-2 border-l-4 rounded-lg shadow-lg pointer-events-auto min-w-[300px] max-w-sm overflow-hidden animate-in slide-in-from-right-full ${getColors()}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onContextMenu={handleContextMenu}
    >
      <div className="flex items-start gap-3 relative z-10 w-full pr-6">
        <div className="mt-0.5">
          <Icon />
        </div>
        <span className="font-medium text-sm w-full break-words leading-relaxed">{toast.message}</span>
      </div>
      
      <button 
        onClick={() => onRemove(toast.id)}
        className="absolute top-3 right-3 text-current opacity-60 hover:opacity-100 z-10"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress Bar Container - Absolute Bottom */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-black/5">
        <div 
          className={`h-full ${getProgressColor()} transition-all duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
