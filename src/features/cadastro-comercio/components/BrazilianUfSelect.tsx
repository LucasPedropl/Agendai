import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAZIL_UF_LABELS, BRAZIL_UF_OPTIONS, type BrazilUf } from '../brazilianStates';

interface BrazilianUfSelectProps {
  id: string;
  value: string;
  hasError?: boolean;
  onChange: (value: string) => void;
}

export function BrazilianUfSelect({ id, value, hasError, onChange }: BrazilianUfSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return BRAZIL_UF_OPTIONS;
    return BRAZIL_UF_OPTIONS.filter((option) => option.label.toLowerCase().includes(query));
  }, [search]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const selectedLabel = value
    ? `${value} — ${BRAZIL_UF_LABELS[value as BrazilUf] ?? value}`
    : '';

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-invalid={hasError}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-xl border bg-secondary/30 px-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50',
          hasError ? 'border-destructive' : 'border-border',
          selectedLabel ? 'text-foreground' : 'text-foreground/30',
        )}
      >
        <span className="truncate">{selectedLabel || 'UF'}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {isOpen && (
        <div className="mt-1 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
          <input
            autoFocus
            type="search"
            value={search}
            placeholder="Buscar estado..."
            aria-label="Buscar UF"
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 w-full border-b border-border bg-transparent px-3 text-sm outline-none placeholder:text-foreground/30"
          />
          <ul id={listId} role="listbox" className="max-h-44 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">UF não encontrada.</li>
            ) : (
              filteredOptions.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === option.value}
                    className={cn(
                      'flex min-h-10 w-full items-center justify-between px-3 text-left text-sm hover:bg-accent',
                      value === option.value && 'bg-accent font-medium',
                    )}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                  >
                    {option.label}
                    {value === option.value && <Check className="h-4 w-4 text-primary" />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
