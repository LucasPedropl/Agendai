import { useComercioContextOptional } from '@/contexts/ComercioContext';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { fetchAdminComercios } from '@/lib/apiHelpers';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/contexts/AuthContext';
import { getFriendlyErrorMessage } from '@/lib/errors';

/**
 * Resolve o ID do comércio vinculado ao usuário admin/profissional.
 * Dentro do AdminLayout usa cache compartilhado (ComercioContext).
 */
export function useComercioId() {
  const ctx = useComercioContextOptional();
  const { token, userType } = useAuth();
  const isAdminArea = userType === 'estabelecimento' || userType === 'profissional';

  const fallback = useQuery({
    queryKey: queryKeys.adminComercios,
    queryFn: () => fetchAdminComercios(fetchApi),
    enabled: !ctx && Boolean(token) && isAdminArea,
  });

  if (ctx) {
    return {
      comercioId: ctx.comercioId,
      isLoading: ctx.isLoading,
      isFetching: ctx.isFetching,
      error: ctx.error,
      reload: ctx.reload,
    };
  }

  const list = fallback.data ?? [];
  return {
    comercioId: list[0]?.id ?? null,
    isLoading: fallback.isPending,
    isFetching: fallback.isFetching,
    error: fallback.error
      ? getFriendlyErrorMessage(fallback.error, 'Não foi possível carregar seu estabelecimento.')
      : null,
    reload: () => void fallback.refetch(),
  };
}
