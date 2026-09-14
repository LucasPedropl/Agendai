import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { normalizeApiList } from '@/lib/apiHelpers';
import { queryKeys } from '@/lib/queryKeys';

/**
 * `GET /api/Agenda/Cliente` — desde 09/09/2026 a API tira o usuário do JWT; a rota
 * antiga `/Cliente/{id}` não existe mais. `userId` sobrou apenas como chave de cache
 * (troca de conta na mesma aba não pode reaproveitar a lista anterior).
 */
export function useClienteAgendamentos<T = Record<string, unknown>>(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.clienteAgendamentos(userId) : ['cliente', 'agendamentos', 'none'],
    queryFn: async () => {
      const data = await fetchApi('/api/Agenda/Cliente');
      return normalizeApiList<T>(data);
    },
    enabled: Boolean(userId),
  });
}

/**
 * `GET /api/Agenda/Cliente-Historico` — mesma mudança de `/Cliente-Historico/{id}`.
 * `date` (opcional) é um limite superior: a API devolve só o que ocorreu até essa data.
 */
export function useClienteHistorico<T = Record<string, unknown>>(
  userId: string | undefined,
  date?: Date,
) {
  const dateParam = date ? date.toISOString() : '';

  return useQuery({
    queryKey: userId
      ? queryKeys.clienteHistorico(userId, dateParam)
      : ['cliente', 'historico', 'none'],
    queryFn: async () => {
      const path = dateParam
        ? `/api/Agenda/Cliente-Historico?date=${encodeURIComponent(dateParam)}`
        : '/api/Agenda/Cliente-Historico';
      const data = await fetchApi(path);
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
