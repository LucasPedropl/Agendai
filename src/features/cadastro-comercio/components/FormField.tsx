import React from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  htmlFor: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export function FormField({ htmlFor, label, error, hint, children }: FormFieldProps) {
  const errorId = `${htmlFor}-error`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const TextAreaField = React.forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ className, hasError, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[88px] w-full rounded-xl border bg-secondary/30 px-4 py-2 text-sm transition-all placeholder:text-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50',
        hasError ? 'border-destructive' : 'border-border',
        className,
      )}
      {...props}
    />
  ),
);
TextAreaField.displayName = 'TextAreaField';
