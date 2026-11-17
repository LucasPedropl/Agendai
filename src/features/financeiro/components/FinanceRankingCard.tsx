import { Card } from '@/components/ui/card';
import { formatBRL } from '@/lib/utils';
import type { RevenueRanking } from '../lib/financeAggregations';

interface FinanceRankingCardProps {
  title: string;
  subtitle: string;
  items: readonly RevenueRanking[];
  emptyMessage: string;
  countLabels: { singular: string; plural: string };
}

export function FinanceRankingCard({ title, subtitle, items, emptyMessage, countLabels }: FinanceRankingCardProps) {
  return (
    <Card className="min-w-0 border border-border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      {items.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ol className="mt-6 space-y-5">
          {items.map((item, index) => (
            <li key={item.key}>
              <div className="flex items-start justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <p className="break-words font-medium text-foreground"><span className="mr-2 text-muted-foreground">{index + 1}.</span>{item.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.count} {item.count === 1 ? countLabels.singular : countLabels.plural}</p>
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
