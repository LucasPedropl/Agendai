import { BarChart2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import { formatBRL } from '@/lib/utils';
import type { buildFinanceSummary, RevenueRanking } from '../lib/financeAggregations';

type FinanceSummary = ReturnType<typeof buildFinanceSummary>;
const CHART_COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];
const tooltipStyle = {
  backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))',
  borderRadius: '12px', color: 'hsl(var(--foreground))',
};

function RevenueRankingCard({ title, items, emptyMessage }: { title: string; items: RevenueRanking[]; emptyMessage: string }) {
  return (
    <Card className="min-w-0 border border-border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">Até 5 maiores receitas · todo o histórico</p>
      {items.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ol className="mt-6 space-y-5">
          {items.map((item, index) => (
            <li key={item.key}>
              <div className="flex items-start justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <p className="break-words font-medium text-foreground"><span className="mr-2 text-muted-foreground">{index + 1}.</span>{item.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.count} {item.count === 1 ? 'registro' : 'registros'}</p>
                </div>
                <span className="shrink-0 font-semibold tabular-nums text-foreground">{formatBRL(item.value)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div className="h-full rounded-full bg-primary" style={{ width: `${items[0].value > 0 ? item.value / items[0].value * 100 : 0}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export function FinanceCharts({ summary }: { summary: FinanceSummary }) {
  const hasMonthlyRevenue = summary.monthlyRevenue.some(month => month.value > 0);
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Receita dos serviços realizados e dos pagamentos recebidos sem vínculo com esses serviços.</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="min-w-0 border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground">Receitas por mês</h3>
          <p className="mb-6 mt-1 text-xs text-muted-foreground">Últimos 6 meses</p>
          {hasMonthlyRevenue ? (
            <div className="h-[300px] w-full" role="img" aria-label="Receita mensal dos últimos seis meses">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.monthlyRevenue} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis width={80} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(value: number) => `R$ ${value}`} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} formatter={(value) => [formatBRL(Number(value)), 'Receita']} contentStyle={tooltipStyle} itemStyle={{ color: 'hsl(var(--foreground))' }} />
                  <Bar dataKey="value" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <BarChart2 className="h-10 w-10 opacity-30" />
              <p className="text-sm">Nenhuma receita registrada nos últimos 6 meses.</p>
            </div>
          )}
        </Card>
        <RevenueRankingCard title="Serviços que mais faturam" items={summary.serviceRanking} emptyMessage="Nenhum serviço realizado ou pagamento recebido para exibir." />
        {summary.professionalRanking.length > 0 && (
          <RevenueRankingCard title="Receita por profissional" items={summary.professionalRanking} emptyMessage="Nenhuma receita por profissional para exibir." />
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
