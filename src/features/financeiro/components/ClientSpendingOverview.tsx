import { CalendarCheck, ChevronRight, DollarSign, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatBRL } from '@/lib/utils';
import type { ClientSpendingSummary } from '../lib/financeAggregations';

interface ClientSpendingOverviewProps {
  summary: ClientSpendingSummary;
  isLoading: boolean;
  hasError: boolean;
  onViewHistory: () => void;
}

export function ClientSpendingOverview({ summary, isLoading, hasError, onViewHistory }: ClientSpendingOverviewProps) {
  const unavailable = isLoading || (hasError && summary.servicesCount === 0);
  const placeholder = isLoading ? '…' : '—';
  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3" aria-busy={isLoading}>
      <div className="relative min-w-0 overflow-hidden rounded-[2.5rem] border border-border bg-background p-6 text-foreground shadow-xl sm:p-10 lg:col-span-2">
        <div className="relative z-10 flex h-full flex-col justify-between gap-8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <h1 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Total gasto</h1>
              <p className="break-words text-3xl font-black tracking-tight tabular-nums sm:text-5xl">{unavailable ? placeholder : formatBRL(summary.totalSpent)}</p>
              <p className="text-xs text-muted-foreground">Todo o histórico</p>
            </div>
            <div className="shrink-0 rounded-2xl bg-muted p-3 sm:p-4">
              <PieChart className="h-6 w-6 text-primary sm:h-8 sm:w-8" aria-hidden="true" />
            </div>
          </div>
          <dl className="flex flex-wrap gap-6 pt-4">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Serviços realizados</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">{unavailable ? placeholder : summary.servicesCount}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Média por serviço</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">{unavailable ? placeholder : formatBRL(summary.averagePerService)}</dd>
            </div>
          </dl>
        </div>
        <DollarSign className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 -rotate-12 text-primary/5" aria-hidden="true" />
      </div>
      <div className="relative flex min-w-0 flex-col justify-between gap-8 overflow-hidden rounded-[2.5rem] bg-primary p-6 text-primary-foreground shadow-xl sm:p-10">
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-xl font-bold"><CalendarCheck className="h-5 w-5 shrink-0" aria-hidden="true" />Neste mês</h2>
          <p className="break-words text-3xl font-black tabular-nums">{unavailable ? placeholder : formatBRL(summary.currentMonthSpent)}</p>
          <p className="text-sm">{unavailable ? placeholder : `${summary.currentMonthCount} ${summary.currentMonthCount === 1 ? 'serviço realizado' : 'serviços realizados'}`}</p>
        </div>
        <Button variant="outline" onClick={onViewHistory} className="h-12 w-full rounded-2xl font-bold text-foreground">
          Ver histórico <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
