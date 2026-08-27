import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { normalizeApiList } from '@/lib/apiHelpers';
import { queryKeys } from '@/lib/queryKeys';

export function useClienteAgendamentos<T = Record<string, unknown>>(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.clienteAgendamentos(userId) : ['cliente', 'agendamentos', 'none'],
    queryFn: async () => {
      const data = await fetchApi(`/api/Agenda/Cliente/${userId}`);
      return normalizeApiList<T>(data);
    },
    enabled: Boolean(userId),
  });
}

export function useClienteHistorico<T = Record<string, unknown>>(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.clienteHistorico(userId) : ['cliente', 'historico', 'none'],
    queryFn: async () => {
      const data = await fetchApi(`/api/Agenda/Cliente-Historico/${userId}`);
      return normalizeApiList<T>(data, ['Histórico Vazio']);
    },
    enabled: Boolean(userId),
  });
}

export function useClienteAvaliacoes<T = Record<string, unknown>>(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.clienteAvaliacoes(userId) : ['cliente', 'avaliacoes', 'none'],
    queryFn: async () => {
      const data = await fetchApi(`/api/Avaliacoes/Usuario/${userId}`, {
        skipToast: true,
        notFoundAsEmpty: true,
      });
      return normalizeApiList<T>(data);
    },
    enabled: Boolean(userId),
  });
}

export function useComerciosPublicos() {
  return useQuery({
    queryKey: queryKeys.comerciosPublicos,
    queryFn: async () => {
      const data = await fetchApi('/api/Comercios', { method: 'GET', skipToast: true });
      return Array.isArray(data) ? data : [];
    },
  });
}

export function useClientePagamentos() {
  return useQuery({
    queryKey: queryKeys.clientePagamentos('self'),
    queryFn: async () => {
      const data = await fetchApi('/api/Pagamentos/Pagamentos-Cliente', { skipToast: true });
      return Array.isArray(data) ? data : [];
    },
  });
}
