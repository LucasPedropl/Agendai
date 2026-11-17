import type { ClientSpendingSummary } from '../lib/financeAggregations';
import { FinanceRankingCard } from './FinanceRankingCard';
import { MonthlyFinanceChart } from './MonthlyFinanceChart';

const rankingSubtitle = 'Até 5 maiores gastos · todo o histórico';
const countLabels = { singular: 'vez', plural: 'vezes' };

export function ClientSpendingCharts({ summary }: { summary: ClientSpendingSummary }) {
  return (
    <section className="grid min-w-0 gap-6 lg:grid-cols-2" aria-label="Análise dos gastos">
      <MonthlyFinanceChart
        title="Gastos por mês"
        subtitle="Últimos 6 meses"
        items={summary.monthlySpending}
        valueLabel="Gasto"
        ariaLabel="Gastos mensais dos últimos seis meses"
        emptyMessage="Nenhum gasto com serviços nos últimos 6 meses."
      />
      <FinanceRankingCard title="Serviços em que você mais gasta" subtitle={rankingSubtitle} items={summary.serviceRanking} countLabels={countLabels} emptyMessage="Seus serviços mais realizados aparecerão aqui." />
      {summary.establishmentRanking.length > 0 && (
        <FinanceRankingCard title="Onde você mais gasta" subtitle={rankingSubtitle} items={summary.establishmentRanking} countLabels={countLabels} emptyMessage="Nenhum estabelecimento para exibir." />
      )}
    </section>
  );
}
