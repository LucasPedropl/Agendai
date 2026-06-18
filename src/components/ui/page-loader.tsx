import { IconLoader2 } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface PageLoaderProps {
  label?: string;
  className?: string;
  fullPage?: boolean;
}

export function PageLoader({ label, className, fullPage = true }: PageLoaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullPage ? 'min-h-[40vh] p-8' : 'p-4',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      {label && <p className="text-sm text-muted-foreground font-medium">{label}</p>}
    </div>
  );
}
