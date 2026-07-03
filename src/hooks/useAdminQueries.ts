import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import {
  fetchComercioUsuariosList,
  getHistoricoPeriodoAtual,
  normalizeApiList,
} from '@/lib/apiHelpers';
import { queryKeys } from '@/lib/queryKeys';

export function useAgendaComercio(comercioId: number | null) {
  return useQuery({
    queryKey: comercioId ? queryKeys.agendaComercio(comercioId) : ['agenda', 'comercio', 'none'],
    queryFn: async () => {
      const data = await fetchApi(`/api/Agenda/Comercio/${comercioId}`, { skipToast: true } as RequestInit);
      return normalizeApiList<Record<string, unknown>>(data, ['Agenda Vazia']);
    },
    enabled: Boolean(comercioId),
  });
}

export function useHistoricoComercio(
  comercioId: number | null,
  statusFilter: string
) {
  const periodo = getHistoricoPeriodoAtual();
  return useQuery({
    queryKey: comercioId
      ? queryKeys.historicoComercio(comercioId, periodo, statusFilter)
      : ['agenda', 'historico', 'none'],
    queryFn: async () => {
      const query = new URLSearchParams({ periodo });
      if (statusFilter) query.set('status', statusFilter);
      const data = await fetchApi(
        `/api/Agenda/Comercio-Historico/${comercioId}?${query.toString()}`,
        { skipToast: true } as RequestInit
      );
      return normalizeApiList<Record<string, unknown>>(data, ['Histórico Vazio']);
    },
    enabled: Boolean(comercioId),
  });
}

export function useComercioUsuarios(
  comercioId: number | null,
  tipo: 'Clientes' | 'Profissionais'
) {
  return useQuery({
    queryKey: comercioId ? queryKeys.comercioUsuarios(tipo, comercioId) : ['comercio-usuarios', tipo, 'none'],
    queryFn: () => fetchComercioUsuariosList<Record<string, unknown>>(fetchApi, tipo, comercioId!),
    enabled: Boolean(comercioId),
  });
}

export function useServicosComercio(comercioId: number | null) {
  return useQuery({
    queryKey: comercioId ? queryKeys.servicos(comercioId) : ['servicos', 'none'],
    queryFn: async () => {
      const data = await fetchApi(`/api/Servicos/Todos/${comercioId}`, { skipToast: true } as RequestInit);
      return normalizeApiList<Record<string, unknown>>(data);
    },
    enabled: Boolean(comercioId),
  });
}

export function useCategoriasComercio(comercioId: number | null) {
  return useQuery({
    queryKey: comercioId ? queryKeys.categorias(comercioId) : ['categorias', 'none'],
    queryFn: async () => {
      const data = await fetchApi(`/api/Categorias/Todas/${comercioId}`, { skipToast: true } as RequestInit);
      return normalizeApiList<Record<string, unknown>>(data);
    },
    enabled: Boolean(comercioId),
  });
}

export function usePagamentosEmpresa(comercioId: number | null) {
  return useQuery({
    queryKey: comercioId ? queryKeys.pagamentosEmpresa(comercioId) : ['pagamentos', 'empresa', 'none'],
    queryFn: async () => {
      const data = await fetchApi(`/api/Pagamentos/Pagamentos-Empresa/${comercioId}`, {
        skipToast: true,
      } as RequestInit);
      return Array.isArray(data) ? data : [];
    },
    enabled: Boolean(comercioId),
  });
}
