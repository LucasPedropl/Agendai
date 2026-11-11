'use client';

import { useAuth } from '@/contexts/AuthContext';
import { getUserIdFromToken } from '@/lib/apiHelpers';
import { useComercioId } from '@/hooks/useComercioId';
import { useDashboardData } from '@/hooks/useDashboardQueries';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { DashboardMetricCards } from '@/features/dashboard/components/DashboardMetricCards';
import { WeeklyFlowChart } from '@/features/dashboard/components/WeeklyFlowChart';
import { UpcomingAppointmentsCard } from '@/features/dashboard/components/UpcomingAppointmentsCard';
import { DashboardSkeleton } from '@/features/dashboard/components/DashboardSkeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const { user, userType, token } = useAuth();
  const isProfissional = userType === 'profissional';
  const profissionalId = (token ? getUserIdFromToken(token) : null) ?? (user?.id ? String(user.id) : null);

  const {
    comercioId,
    isLoading: isLoadingComercio,
    error: comercioError,
  } = useComercioId();

  const {
    metrics,
    weeklyFlow,
    upcomingAppointments,
    isLoading: isLoadingData,
    isFetching,
    isError,
    errorMessage,
    refetch,
    hasData,
  } = useDashboardData({
    comercioId,
    isProfissional,
    profissionalId,
  });

  // Estado de carregamento inicial
  if (isLoadingComercio || (isLoadingData && !hasData)) {
    return <DashboardSkeleton />;
  }

  // Falha de vinculação de comércio
  if (!comercioId) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Nenhum estabelecimento vinculado"
        description={
          comercioError ||
          'Você precisa estar vinculado a um estabelecimento ativo para visualizar o dashboard.'
        }
      />
    );
  }

  // Falha crítica nas requisições sem nenhum dado em cache
  if (isError && !hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          Não foi possível carregar as métricas do dashboard
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {errorMessage || 'Ocorreu um erro ao comunicar com a API. Tente recarregar os dados.'}
        </p>
        <Button onClick={() => void refetch()} variant="outline" className="mt-2">
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <DashboardHeader
        isProfissional={isProfissional}
        isFetching={isFetching}
        isError={isError}
        onRefresh={() => void refetch()}
      />

      <DashboardMetricCards metrics={metrics} isProfissional={isProfissional} />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        <WeeklyFlowChart data={weeklyFlow} />
        <UpcomingAppointmentsCard
          appointments={upcomingAppointments}
          isProfissional={isProfissional}
        />
      </div>
    </div>
  );
}
