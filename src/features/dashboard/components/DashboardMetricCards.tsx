import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, CalendarDays, Users, TrendingUp } from 'lucide-react';
import type { DashboardMetrics } from '@/hooks/useDashboardQueries';

interface DashboardMetricCardsProps {
  metrics: DashboardMetrics;
  isProfissional: boolean;
}

export function DashboardMetricCards({ metrics, isProfissional }: DashboardMetricCardsProps) {
  const isCancelTaxHigh = metrics.taxaCancelamento > 5;

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Receita do Mês */}
      <Card className="p-2 border-none bg-primary text-primary-foreground shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
            {isProfissional ? 'Minha Receita do Mês' : 'Receita do Mês'}
          </CardTitle>
          <DollarSign className="h-4 w-4 opacity-70" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-black tracking-tight">
            R${' '}
            {metrics.receitaMes.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <p className="text-[10px] font-semibold opacity-80 mt-1.5 flex items-center gap-1">
            {metrics.receitaCrescimentoPercentual !== null ? (
              <>
                <span>
                  {metrics.receitaCrescimentoPercentual >= 0 ? '↑' : '↓'}{' '}
                  {Math.abs(metrics.receitaCrescimentoPercentual)}%
                </span>
                <span>em relação ao mês anterior</span>
              </>
            ) : (
              <span>Sem histórico do mês anterior</span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* 2. Agendamentos Hoje */}
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            {isProfissional ? 'Meus Atendimentos Hoje' : 'Agendamentos Hoje'}
          </CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground/60" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {metrics.agendamentosHoje}
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, metrics.taxaConclusaoHoje))}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground min-w-[32px] text-right">
              {metrics.taxaConclusaoHoje}%
            </span>
          </div>
          <p className="text-[10px] font-medium text-muted-foreground mt-1">
            {metrics.agendamentosHoje > 0
              ? `${metrics.agendamentosHojeConcluidos} de ${metrics.agendamentosHoje} concluído(s)`
              : 'Nenhum agendamento para hoje'}
          </p>
        </CardContent>
      </Card>

      {/* 3. Clientes */}
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            {isProfissional ? 'Clientes Atendidos' : 'Clientes Cadastrados'}
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground/60" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {metrics.clientesTotal}
          </div>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
            <span>●</span>
            {metrics.clientesSemana > 0
              ? `${metrics.clientesSemana} com agendamento nesta semana`
              : 'Nenhum agendamento nesta semana'}
          </p>
        </CardContent>
      </Card>

      {/* 4. Taxa de Cancelamento */}
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            Taxa de Cancelamento
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground/60" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl sm:text-3xl font-bold tracking-tight ${
              isCancelTaxHigh
                ? 'text-rose-500'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {metrics.taxaCancelamento}%
          </div>
          <p className="text-[11px] font-medium text-muted-foreground mt-1">
            {metrics.totalAgendamentosMes > 0
              ? `${metrics.totalCanceladosMes} de ${metrics.totalAgendamentosMes} no mês`
              : 'Sem agendamentos no mês'}
          </p>
          <p className="text-[10px] font-medium text-muted-foreground/70 mt-0.5">
            Meta: abaixo de 5%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
