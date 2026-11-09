import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { normalizeApiList } from '@/lib/apiHelpers';
import { Estabelecimento, Servico, Profissional } from '../types';

export function useEstablishmentDetails(comercioId: number | undefined) {
  // Como GET /api/Comercios/:id é restrito a Admin/Profissional (retorna 401 para Cliente),
  // buscamos a lista pública em cache e localizamos o comércio pelo ID.
  return useQuery({
    queryKey: ['comercio-details', comercioId],
    queryFn: async (): Promise<Estabelecimento | null> => {
      if (!comercioId) return null;
      try {
        const res = await fetchApi('/api/Comercios?pagina=1&qtdPagina=100', {
          method: 'GET',
          skipToast: true,
        });
        const list: Estabelecimento[] =
          res && typeof res === 'object' && 'dados' in res && Array.isArray((res as { dados: Estabelecimento[] }).dados)
            ? (res as { dados: Estabelecimento[] }).dados
            : normalizeApiList<Estabelecimento>(res);

        const found = list.find((e) => e.id === comercioId);
        return found ?? null;
      } catch {
        return null;
      }
    },
    enabled: Boolean(comercioId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useComercioServices(comercioId: number | undefined) {
  return useQuery({
    queryKey: ['comercio-services', comercioId],
    queryFn: async (): Promise<Servico[]> => {
      if (!comercioId) return [];
      const data = await fetchApi(`/api/Servicos/Todos/${comercioId}`, {
        method: 'GET',
        skipToast: true,
        notFoundAsEmpty: true,
      });
      return Array.isArray(data) ? (data as Servico[]) : [];
    },
    enabled: Boolean(comercioId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useComercioProfessionals(comercioId: number | undefined) {
  return useQuery({
    queryKey: ['comercio-professionals', comercioId],
    queryFn: async (): Promise<Profissional[]> => {
      if (!comercioId) return [];
      const data = await fetchApi(`/api/ComercioUsuarios/Profissionais-Agendar/${comercioId}`, {
        method: 'GET',
        skipToast: true,
        notFoundAsEmpty: true,
      });
      return Array.isArray(data) ? (data as Profissional[]) : [];
    },
    enabled: Boolean(comercioId),
    staleTime: 5 * 60 * 1000,
  });
}
