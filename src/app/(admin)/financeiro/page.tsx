'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, ArrowUpRight, Calendar, DollarSign, Filter, RefreshCw, Search, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePagamentosEmpresa, useAgendaComercio, useHistoricoComercioTodos, useServicosComercio } from '@/hooks/useAdminQueries';
import { useComercioId } from '@/hooks/useComercioId';
import { formatBRL } from '@/lib/utils';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { FinanceCharts } from '@/features/financeiro/components/FinanceCharts';
import {
  UNKNOWN_SERVICE_NAME,
  buildFinanceSummary, buildPerformedServices, filterFinanceTransactions, financeDate,
  type FinancePayment, type FinanceService, type StatusFilter, type TransactionStatus,
} from '@/features/financeiro/lib/financeAggregations';

const STATUS_LABELS: Record<TransactionStatus, string> = {
  performed: 'Serviço realizado', pago: 'Pago', pendente: 'Pendente', cancelado: 'Cancelado', reembolsado: 'Reembolsado',
};
const STATUS_STYLES: Record<TransactionStatus, string> = {
  performed: 'bg-primary/10 text-primary',
  pago: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  pendente: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  cancelado: 'bg-destructive/10 text-destructive',
  reembolsado: 'bg-muted text-muted-foreground',
};

export default function AdminFinanceiroPage() {
  const { comercioId, isLoading: isComercioLoading } = useComercioId();
  const paymentsQuery = usePagamentosEmpresa<FinancePayment>(comercioId);
  const historyQuery = useHistoricoComercioTodos(comercioId);
  const agendaQuery = useAgendaComercio(comercioId);
  const servicesQuery = useServicosComercio<FinanceService>(comercioId);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const performed = useMemo(() => buildPerformedServices(
    historyQuery.data ?? [], agendaQuery.data ?? [], servicesQuery.data ?? [], new Date(),
  ), [historyQuery.data, agendaQuery.data, servicesQuery.data]);
  const summary = useMemo(() => buildFinanceSummary(performed, paymentsQuery.data ?? [], new Date()), [performed, paymentsQuery.data]);
  const filteredTransactions = useMemo(() => filterFinanceTransactions(summary.transactions, searchTerm, statusFilter), [summary.transactions, searchTerm, statusFilter]);
  const servicesLoading = Boolean(comercioId) && (historyQuery.isPending || agendaQuery.isPending || servicesQuery.isPending);
  const paymentsLoading = Boolean(comercioId) && paymentsQuery.isPending;
  const servicesError = historyQuery.isError || agendaQuery.isError || servicesQuery.isError;

  if (isComercioLoading) {
    return <div className="flex items-center justify-center p-12" role="status" aria-label="Carregando financeiro"><RefreshCw className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestão financeira</h1>
        <p className="text-muted-foreground">Acompanhe os serviços realizados, os pagamentos e a receita do negócio.</p>
      </div>

      {paymentsQuery.isError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 text-foreground">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <p className="text-sm">{getFriendlyErrorMessage(paymentsQuery.error, 'Não foi possível carregar os pagamentos.')} Os serviços disponíveis continuam sendo exibidos.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void paymentsQuery.refetch()}><RefreshCw className="mr-2 h-3.5 w-3.5" />Tentar novamente</Button>
        </div>
      )}
      {servicesError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 text-foreground">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <p className="text-sm">Não foi possível carregar todos os serviços. Os valores e gráficos podem estar incompletos.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { void historyQuery.refetch(); void agendaQuery.refetch(); void servicesQuery.refetch(); }}><RefreshCw className="mr-2 h-3.5 w-3.5" />Tentar novamente</Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-border bg-card p-6 shadow-sm">
          <Calendar className="mb-4 h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Serviços realizados</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{servicesLoading ? 'Carregando…' : servicesError ? '—' : formatBRL(summary.performedTotal)}</p>
          <p className="mt-2 text-xs text-muted-foreground">{servicesError ? 'Dados incompletos' : `${summary.performedCount} atendimentos concluídos`}</p>
        </Card>
        <Card className="border border-border bg-card p-6 shadow-sm">
          <TrendingUp className="mb-4 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-medium text-muted-foreground">Total recebido</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{paymentsLoading ? 'Carregando…' : paymentsQuery.isError ? '—' : formatBRL(summary.totalReceived)}</p>
          <p className="mt-2 text-xs text-muted-foreground">Pagamentos confirmados no sistema</p>
        </Card>
        <Card className="border border-border bg-card p-6 shadow-sm">
          <DollarSign className="mb-4 h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Ticket médio</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{servicesLoading ? 'Carregando…' : servicesError || !summary.performedCount ? '—' : formatBRL(summary.averageTicket)}</p>
          <p className="mt-2 text-xs text-muted-foreground">Valor médio por serviço realizado</p>
        </Card>
        <Card className="border border-border bg-card p-6 shadow-sm">
          <ArrowUpRight className="mb-4 h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Pagamentos concluídos</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{paymentsLoading ? 'Carregando…' : paymentsQuery.isError ? '—' : summary.paidCount}</p>
          <p className="mt-2 text-xs text-muted-foreground">Todo o histórico</p>
        </Card>
      </div>

      <Tabs defaultValue="movimentacao" className="w-full">
        <TabsList className="mb-6 bg-muted p-1">
          <TabsTrigger value="movimentacao">Movimentação</TabsTrigger>
          <TabsTrigger value="analise">Análise gráfica</TabsTrigger>
        </TabsList>
        <TabsContent value="movimentacao">
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <CardTitle className="text-foreground">Histórico de transações</CardTitle>
                <p className="mt-2 text-xs text-muted-foreground">Serviços realizados e pagamentos, sem repetir o mesmo atendimento.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar transação..." aria-label="Buscar transação por serviço, cliente ou profissional" className="min-w-[180px] pl-9" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} />
                </div>
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2 py-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <select className="cursor-pointer bg-transparent text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" value={statusFilter} onChange={event => setStatusFilter(event.target.value as StatusFilter)} aria-label="Filtrar por status">
                    <option value="all" className="bg-background text-foreground">Todos os status</option>
                    <option value="performed" className="bg-background text-foreground">Serviços realizados</option>
                    <option value="pago" className="bg-background text-foreground">Pago</option>
                    <option value="pendente" className="bg-background text-foreground">Pendente</option>
                    <option value="cancelado" className="bg-background text-foreground">Cancelado</option>
                    <option value="reembolsado" className="bg-background text-foreground">Reembolsado</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(servicesLoading || paymentsLoading) && <p role="status" className="mb-4 text-sm text-muted-foreground">Carregando movimentações…</p>}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-muted-foreground">
                  <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th scope="col" className="px-4 py-3">Descrição</th>
                      <th scope="col" className="px-4 py-3">Data</th>
                      <th scope="col" className="px-4 py-3">Status</th>
                      <th scope="col" className="px-4 py-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-12 text-center">
                        <DollarSign className="mx-auto mb-4 h-10 w-10 opacity-20" />
                        {servicesLoading || paymentsLoading ? 'Aguarde o carregamento dos dados.' : servicesError || paymentsQuery.isError ? 'Não foi possível carregar todas as movimentações. Tente novamente.' : summary.transactions.length ? 'Nenhuma transação encontrada com os filtros aplicados.' : 'Nenhum serviço realizado ou pagamento registrado ainda.'}
                      </td></tr>
                    ) : filteredTransactions.map(transaction => (
                      <tr key={transaction.key} className="border-b border-border transition-colors hover:bg-muted/30">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-foreground">{transaction.serviceName === UNKNOWN_SERVICE_NAME ? transaction.description : transaction.serviceName}</p>
                          {transaction.clientName && <p className="mt-1 text-xs">Cliente: {transaction.clientName}</p>}
                          {transaction.professionalName && <p className="mt-1 text-xs">Profissional: {transaction.professionalName}</p>}
                          {transaction.paymentId && <p className="mt-1 text-xs">Pagamento #{transaction.paymentId}</p>}
                          <p className="mt-1 text-xs font-medium">Entrada</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">{financeDate(transaction.date)?.toLocaleDateString('pt-BR') ?? 'Data não informada'}</td>
                        <td className="px-4 py-4"><span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[transaction.status]}`}>{STATUS_LABELS[transaction.status]}</span></td>
                        <td className="whitespace-nowrap px-4 py-4 text-right font-bold tabular-nums text-foreground">{formatBRL(transaction.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analise">
          {servicesLoading || paymentsLoading ? <p role="status" className="py-12 text-center text-muted-foreground">Carregando análise financeira…</p> : <FinanceCharts summary={summary} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
