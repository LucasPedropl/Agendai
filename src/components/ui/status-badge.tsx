import { cn } from '@/lib/utils';

type StatusVariant = 'success' | 'warning' | 'neutral' | 'danger' | 'info';

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  neutral: 'bg-muted text-muted-foreground',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-primary/10 text-primary',
};

export function getStatusVariant(status: string): StatusVariant {
  const s = status.toLowerCase();
  if (s.includes('ativo') || s.includes('confirm') || s.includes('finaliz') || s.includes('conclu')) {
    return 'success';
  }
  if (s.includes('pendent') || s.includes('aguard')) return 'warning';
  if (s.includes('cancel') || s.includes('inativ')) return 'danger';
  return 'neutral';
}

export function StatusBadge({ label, variant = 'neutral', className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
        variantStyles[variant],
        className
      )}
    >
      {label}
    </span>
  );
}
