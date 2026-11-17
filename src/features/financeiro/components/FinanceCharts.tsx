import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { formatBRL } from '@/lib/utils';
import type { buildFinanceSummary } from '../lib/financeAggregations';
import { FinanceRankingCard } from './FinanceRankingCard';
import { MonthlyFinanceChart } from './MonthlyFinanceChart';

type FinanceSummary = ReturnType<typeof buildFinanceSummary>;
const CHART_COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];
const tooltipStyle = {
  backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))',
  borderRadius: '12px', color: 'hsl(var(--foreground))',
};

const rankingSubtitle = 'Até 5 maiores receitas · todo o histórico';
const countLabels = { singular: 'registro', plural: 'registros' };

export function FinanceCharts({ summary }: { summary: FinanceSummary }) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Receita dos serviços realizados e dos pagamentos recebidos sem vínculo com esses serviços.</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <MonthlyFinanceChart
          title="Receitas por mês"
          subtitle="Últimos 6 meses"
          items={summary.monthlyRevenue}
          valueLabel="Receita"
          ariaLabel="Receita mensal dos últimos seis meses"
          emptyMessage="Nenhuma receita registrada nos últimos 6 meses."
        />
        <FinanceRankingCard title="Serviços que mais faturam" subtitle={rankingSubtitle} items={summary.serviceRanking} countLabels={countLabels} emptyMessage="Nenhum serviço realizado ou pagamento recebido para exibir." />
        {summary.professionalRanking.length > 0 && (
          <FinanceRankingCard title="Receita por profissional" subtitle={rankingSubtitle} items={summary.professionalRanking} countLabels={countLabels} emptyMessage="Nenhuma receita por profissional para exibir." />
        )}
        {summary.paymentMethods.length > 0 && (
          <Card className="min-w-0 border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground">Receitas por forma de pagamento</h3>
            <p className="mb-4 mt-1 text-xs text-muted-foreground">Somente pagamentos recebidos</p>
            <div className="h-[300px] w-full" role="img" aria-label="Distribuição dos pagamentos recebidos por forma de pagamento">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={summary.paymentMethods} cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                    {summary.paymentMethods.map((method, index) => <Cell key={method.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => [formatBRL(Number(value)), 'Total']} contentStyle={tooltipStyle} itemStyle={{ color: 'hsl(var(--foreground))' }} />
                  <Legend formatter={(value) => <span className="text-xs text-foreground">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
