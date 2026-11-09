import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  isProfissional: boolean;
  isFetching: boolean;
  isError: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({
  isProfissional,
  isFetching,
  isError,
  onRefresh,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isError
                ? 'bg-rose-500'
                : isFetching
                ? 'bg-amber-400 animate-ping'
                : 'bg-emerald-500 animate-pulse'
            }`}
          />
          <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">
            {isError
              ? 'Status: Falha na Sincronização'
              : isFetching
              ? 'Status: Sincronizando Dados...'
              : 'Sistema Operacional: Online'}
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Dashboard.
        </h1>
        <p className="text-foreground/60 mt-1.5 text-sm font-medium">
          {isProfissional
            ? 'Visão geral dos seus atendimentos, clientes e métricas de desempenho.'
            : 'Visão geral do desempenho, faturamento e agendamentos do seu estabelecimento.'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isFetching}
          className="text-xs font-semibold"
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Atualizando...' : 'Atualizar Dados'}
        </Button>
      </div>
    </header>
  );
}
