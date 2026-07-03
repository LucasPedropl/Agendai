import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { fetchAdminComercios, type ComercioSummary } from '@/lib/apiHelpers';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/contexts/AuthContext';

interface ComercioContextValue {
  comercios: ComercioSummary[];
  comercioId: number | null;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  hasCommerce: boolean;
  reload: () => void;
}

const ComercioContext = createContext<ComercioContextValue | undefined>(undefined);

export function ComercioProvider({ children }: { children: React.ReactNode }) {
  const { token, userType } = useAuth();
  const isAdminArea = userType === 'estabelecimento' || userType === 'profissional';

  const query = useQuery({
    queryKey: queryKeys.adminComercios,
    queryFn: () => fetchAdminComercios(fetchApi),
    enabled: Boolean(token) && isAdminArea,
  });

  const comercios = query.data ?? [];
  const comercioId = comercios[0]?.id ?? null;
  const hasCommerce = userType === 'profissional' ? true : comercios.length > 0 && Boolean(comercios[0]?.nome);

  const value = useMemo<ComercioContextValue>(
    () => ({
      comercios,
      comercioId,
      isLoading: query.isPending,
      isFetching: query.isFetching,
      error: query.error instanceof Error ? query.error.message : null,
      hasCommerce,
      reload: () => void query.refetch(),
    }),
    [comercios, comercioId, hasCommerce, query]
  );

  return <ComercioContext.Provider value={value}>{children}</ComercioContext.Provider>;
}

export function useComercioContext() {
  const ctx = useContext(ComercioContext);
  if (!ctx) {
    throw new Error('useComercioContext deve ser usado dentro de ComercioProvider');
  }
  return ctx;
}

/** Opcional — retorna null se fora do provider (ex.: hooks legados). */
export function useComercioContextOptional() {
  return useContext(ComercioContext);
}
