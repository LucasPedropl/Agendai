import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { WeeklyFlowDay } from '@/hooks/useDashboardQueries';

interface WeeklyFlowChartProps {
  data: WeeklyFlowDay[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    dataKey?: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const receitaItem = payload.find((p) => p.dataKey === 'receita');
  const cancelItem = payload.find((p) => p.dataKey === 'cancelamentos');

  const receitaVal = Number(receitaItem?.value ?? 0);
  const cancelVal = Number(cancelItem?.value ?? 0);

  return (
    <div className="rounded-xl border border-border bg-background p-3 shadow-xl text-xs space-y-1">
      <p className="font-bold text-foreground border-b border-border/50 pb-1 mb-1.5">{label}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-primary" />
          Receita:
        </span>
        <span className="font-bold text-foreground">
          R$ {receitaVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          Cancelamentos:
        </span>
        <span className="font-bold text-rose-500">{cancelVal}</span>
      </div>
    </div>
  );
}

export function WeeklyFlowChart({ data }: WeeklyFlowChartProps) {
  const hasAnyMovement = data.some((d) => d.receita > 0 || d.cancelamentos > 0 || d.total > 0);

  return (
    <Card className="col-span-1 lg:col-span-4 overflow-hidden border border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border bg-muted/20 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Fluxo Financeiro Semanal
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Receita realizada e cancelamentos dos 7 dias da semana atual
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-foreground/70">Receita</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-foreground/70">Cancelamentos</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {!hasAnyMovement && (
          <div className="mb-2 text-center text-xs text-muted-foreground font-medium">
            Nenhuma movimentação financeira registrada na semana atual.
          </div>
        )}
        <div className="h-[280px] w-full min-w-0">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
                opacity={0.6}
              />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  `R$${Number(value) >= 1000 ? `${(Number(value) / 1000).toFixed(1)}k` : value}`
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="receita"
                name="Receita"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="cancelamentos"
                name="Cancelamentos"
                stroke="#f43f5e"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#f43f5e' }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
