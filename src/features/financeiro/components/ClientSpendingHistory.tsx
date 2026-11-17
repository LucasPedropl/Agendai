import { CalendarCheck, History, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBRL } from '@/lib/utils';
import { financeDate, type PerformedService } from '../lib/financeAggregations';

interface ClientSpendingHistoryProps {
  items: readonly PerformedService[];
  hasHistory: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  hasError: boolean;
}

export function ClientSpendingHistory({ items, hasHistory, search, onSearchChange, isLoading, hasError }: ClientSpendingHistoryProps) {
  const emptyMessage = hasHistory ? 'Nenhum resultado encontrado para essa busca.'
    : hasError ? 'Não foi possível carregar seu histórico de gastos. Tente novamente.'
    : 'Você ainda não tem serviços realizados. Seus gastos aparecerão aqui após os atendimentos.';

  return (
    <section id="historico-gastos" className="min-w-0 scroll-mt-6 space-y-6" aria-labelledby="historico-gastos-titulo">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <h2 id="historico-gastos-titulo" className="flex items-center gap-3 text-2xl font-extrabold text-foreground">
          <History className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />Histórico de gastos
        </h2>
        <div className="w-full space-y-2 lg:max-w-sm">
          <label htmlFor="busca-gastos" className="text-sm font-medium text-foreground">Buscar no histórico</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="busca-gastos" type="search" placeholder="Serviço, estabelecimento ou profissional" value={search} onChange={event => onSearchChange(event.target.value)} className="h-11 min-w-0 pl-9 text-base text-foreground placeholder:text-muted-foreground sm:text-sm" />
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-[2.5rem] border border-border bg-background shadow-sm" aria-busy={isLoading}>
        {isLoading ? (
          <div role="status" className="divide-y divide-border">
            <span className="sr-only">Carregando histórico de gastos…</span>
            {[1, 2, 3].map(index => (
              <div key={index} className="space-y-3 p-6 sm:p-8" aria-hidden="true">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="space-y-4 px-6 py-16 text-center text-muted-foreground" role="status">
            <CalendarCheck className="mx-auto h-12 w-12 opacity-30" aria-hidden="true" />
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map(item => (
              <li key={item.key} className="flex min-w-0 flex-col justify-between gap-4 p-6 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:p-8">
                <div className="min-w-0 space-y-1 [overflow-wrap:anywhere]">
                  <h3 className="text-lg font-bold text-foreground">{item.serviceName}</h3>
                  <p className="text-sm text-muted-foreground">{item.establishmentName ?? 'Estabelecimento não informado'}</p>
                  <p className="text-sm text-muted-foreground">Profissional: {item.professionalName ?? 'Não informado'}</p>
                  <p className="pt-1 text-xs font-medium text-muted-foreground">
                    {financeDate(item.date)?.toLocaleDateString('pt-BR') ?? 'Data não informada'}{item.time && ` · ${item.time}`}
                  </p>
                </div>
                <p className="shrink-0 text-xl font-black tabular-nums text-foreground">{formatBRL(item.value)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
