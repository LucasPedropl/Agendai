import { useMemo, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useClienteAgendamentos, useClienteHistorico } from '@/hooks/useClienteQueries';
import { ClientSpendingCharts } from '@/features/financeiro/components/ClientSpendingCharts';
import { ClientSpendingHistory } from '@/features/financeiro/components/ClientSpendingHistory';
import { ClientSpendingOverview } from '@/features/financeiro/components/ClientSpendingOverview';
import { buildClientSpendingSummary, buildPerformedServices, filterClientSpendingHistory } from '@/features/financeiro/lib/financeAggregations';

export default function ClientFinancasPage() {
  const { user } = useAuth();
  const userId = user?.id ? String(user.id) : undefined;
  const historyQuery = useClienteHistorico(userId);
  const agendaQuery = useClienteAgendamentos(userId);
  const [search, setSearch] = useState('');

  const summary = useMemo(() => {
    const now = new Date();
    const performed = buildPerformedServices(historyQuery.data ?? [], agendaQuery.data ?? [], [], now);
    return buildClientSpendingSummary(performed, now);
  }, [historyQuery.data, agendaQuery.data, historyQuery.dataUpdatedAt, agendaQuery.dataUpdatedAt]);
  const filteredHistory = useMemo(() => filterClientSpendingHistory(summary.history, search), [summary.history, search]);
  const isLoading = Boolean(userId) && (historyQuery.isPending || agendaQuery.isPending);
  const hasError = historyQuery.isError || agendaQuery.isError;
  const isRetrying = historyQuery.isFetching || agendaQuery.isFetching;

  const retryQueries = () => {
    void historyQuery.refetch();
    void agendaQuery.refetch();
  };
  const scrollToHistory = () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('historico-gastos')?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
  };

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-8 px-4 py-8">
      {hasError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-background p-4 text-foreground">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
            <p className="text-sm">Não foi possível carregar todos os agendamentos. Os dados e valores exibidos podem estar incompletos.</p>
          </div>
          <Button variant="outline" onClick={retryQueries} disabled={isRetrying} className="h-11">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} aria-hidden="true" />Tentar novamente
          </Button>
        </div>
      )}
      <ClientSpendingOverview summary={summary} isLoading={isLoading} hasError={hasError} onViewHistory={scrollToHistory} />
      <p className="text-sm text-muted-foreground">Valores calculados pelo preço atual de cada serviço.</p>
      {isLoading ? (
        <p role="status" className="py-12 text-center text-muted-foreground">Carregando seus gastos…</p>
      ) : (
        <ClientSpendingCharts summary={summary} />
      )}
      <ClientSpendingHistory items={filteredHistory} hasHistory={summary.history.length > 0} search={search} onSearchChange={setSearch} isLoading={isLoading} hasError={hasError} />
    </div>
  );
}
