import { BarChart2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import { formatBRL } from '@/lib/utils';
import type { MonthlyTotal } from '../lib/financeAggregations';

interface MonthlyFinanceChartProps {
  title: string;
  subtitle: string;
  items: MonthlyTotal[];
  valueLabel: string;
  ariaLabel: string;
  emptyMessage: string;
}

export function MonthlyFinanceChart({ title, subtitle, items, valueLabel, ariaLabel, emptyMessage }: MonthlyFinanceChartProps) {
  const hasValues = items.some(month => month.value > 0);
  return (
    <Card className="min-w-0 border border-border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="mb-6 mt-1 text-xs text-muted-foreground">{subtitle}</p>
      {hasValues ? (
        <div className="h-[300px] w-full" role="img" aria-label={ariaLabel}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={items} margin={{ left: 12, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis width={80} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(value: number) => `R$ ${value}`} />
              <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} formatter={(value) => [formatBRL(Number(value)), valueLabel]} contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }} itemStyle={{ color: 'hsl(var(--foreground))' }} />
              <Bar dataKey="value" name={valueLabel} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
          <BarChart2 className="h-10 w-10 opacity-30" aria-hidden="true" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      )}
    </Card>
  );
}
