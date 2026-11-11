import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { Estabelecimento, Servico, Profissional } from '../types';

export function useEstablishmentDetails(comercioId: number | undefined) {
  return useQuery({
    queryKey: ['comercio-details', comercioId],
    queryFn: async (): Promise<Estabelecimento | null> => {
      if (!comercioId) return null;
      try {
        const res = await fetchApi(`/api/Comercios/${comercioId}`, {
          method: 'GET',
          skipToast: true,
        });
        return res && typeof res === 'object' ? (res as Estabelecimento) : null;
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
