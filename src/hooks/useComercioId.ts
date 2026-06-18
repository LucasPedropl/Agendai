import { useState, useEffect, useCallback } from 'react';
import { fetchApi } from '@/lib/api';
import { fetchAdminComercios } from '@/lib/apiHelpers';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Resolve o ID do comércio vinculado ao usuário admin/profissional via /api/Comercios/Admin.
 */
export function useComercioId() {
  const { token, userType } = useAuth();
  const [comercioId, setComercioId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || (userType !== 'estabelecimento' && userType !== 'profissional')) {
      setComercioId(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const list = await fetchAdminComercios(fetchApi);
      setComercioId(list[0]?.id ?? null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar comércio';
      setError(message);
      setComercioId(null);
    } finally {
      setIsLoading(false);
    }
  }, [token, userType]);

  useEffect(() => {
    load();
  }, [load]);

  return { comercioId, isLoading, error, reload: load };
}
