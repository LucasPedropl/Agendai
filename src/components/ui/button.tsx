import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]',
          {
            'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90': variant === 'default',
            'border border-border bg-background hover:bg-secondary hover:text-foreground shadow-sm': variant === 'outline',
            'hover:bg-secondary hover:text-foreground': variant === 'ghost',
            'text-primary underline-offset-4 hover:underline': variant === 'link',
            'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20': variant === 'destructive',
            'h-10 px-6 py-2': size === 'default',
            'h-9 rounded-md px-4': size === 'sm',
            'h-11 rounded-xl px-10': size === 'lg',
            'h-10 w-10 p-0': size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
