import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import {
  buildComercioHistoricoPath,
  fetchComercioUsuariosList,
  getHistoricoPeriodoAtual,
  normalizeApiList,
} from '@/lib/apiHelpers';
import { queryKeys } from '@/lib/queryKeys';

export function useAgendaComercio(comercioId: number | null) {
  return useQuery({
    queryKey: comercioId ? queryKeys.agendaComercio(comercioId) : ['agenda', 'comercio', 'none'],
    queryFn: async () => {
      const data = await fetchApi(`/api/Agenda/Comercio/${comercioId}`, { skipToast: true });
      return normalizeApiList<Record<string, unknown>>(data, ['Agenda Vazia']);
    },
    enabled: Boolean(comercioId),
  });
}

export function useHistoricoComercio(
  comercioId: number | null,
  statusFilter: string,
  profissionalId?: string | null
) {
  const periodo = getHistoricoPeriodoAtual();
  const profissional = profissionalId?.trim() ?? '';
  return useQuery({
    queryKey: comercioId
      ? queryKeys.historicoComercio(comercioId, periodo, statusFilter, profissional)
      : ['agenda', 'historico', 'none'],
    queryFn: async () => {
      const path = buildComercioHistoricoPath({
        comercioId: comercioId!,
        periodo,
        status: statusFilter || null,
        profissionalId: profissional || null,
      });
      const data = await fetchApi(path, { skipToast: true });
      return normalizeApiList<Record<string, unknown>>(data, ['Histórico Vazio']);
    },
    enabled: Boolean(comercioId),
  });
}

/** A API devolve `{message}` (ou, antes, uma string pura). */
export function extractApiMessage(payload: unknown): string | null {
  if (typeof payload === 'string') return payload.trim() || null;
  if (payload && typeof payload === 'object') {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === 'string') return message.trim() || null;
  }
  return null;
}

function useAlterarStatusComercioUsuario(
  tipo: 'Clientes' | 'Profissionais',
  comercioId: number | null,
  action: 'Desativar-Usuario' | 'Reativar-Usuario'
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string): Promise<string | null> => {
      if (!comercioId) {
        throw new Error('Comércio não identificado.');
      }
      const data: unknown = await fetchApi(`/api/ComercioUsuarios/${action}/${comercioId}/${userId}`, {
        method: action === 'Desativar-Usuario' ? 'DELETE' : 'PUT',
        skipToast: true,
      });
      return extractApiMessage(data);
    },
    onSuccess: () => {
      if (comercioId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.comercioUsuarios(tipo, comercioId),
        });
      }
    },
  });
}

export function useDesativarComercioUsuario(
  tipo: 'Clientes' | 'Profissionais',
  comercioId: number | null
) {
  return useAlterarStatusComercioUsuario(tipo, comercioId, 'Desativar-Usuario');
}

export function useReativarComercioUsuario(
  tipo: 'Clientes' | 'Profissionais',
  comercioId: number | null
) {
  return useAlterarStatusComercioUsuario(tipo, comercioId, 'Reativar-Usuario');
}

export function useComercioUsuarios<T = Record<string, unknown>>(
  comercioId: number | null,
  tipo: 'Clientes' | 'Profissionais'
) {
  return useQuery({
    queryKey: comercioId ? queryKeys.comercioUsuarios(tipo, comercioId) : ['comercio-usuarios', tipo, 'none'],
    queryFn: () => fetchComercioUsuariosList<T>(fetchApi, tipo, comercioId!),
    enabled: Boolean(comercioId),
  });
}

export function useServicosComercio<T = Record<string, unknown>>(comercioId: number | null) {
  return useQuery({
    queryKey: comercioId ? queryKeys.servicos(comercioId) : ['servicos', 'none'],
    queryFn: async () => {
      const data = await fetchApi(`/api/Servicos/Todos/${comercioId}`, { skipToast: true });
      return normalizeApiList<T>(data);
    },
    enabled: Boolean(comercioId),
  });
}

export function useCategoriasComercio<T = Record<string, unknown>>(comercioId: number | null) {
  return useQuery({
    queryKey: comercioId ? queryKeys.categorias(comercioId) : ['categorias', 'none'],
    queryFn: async () => {
      const data = await fetchApi(`/api/Categorias/Todas/${comercioId}`, { skipToast: true });
      return normalizeApiList<T>(data);
    },
    enabled: Boolean(comercioId),
  });
}

export function usePagamentosEmpresa<T = Record<string, unknown>>(comercioId: number | null) {
  return useQuery({
    queryKey: comercioId ? queryKeys.pagamentosEmpresa(comercioId) : ['pagamentos', 'empresa', 'none'],
    queryFn: async () => {
      const data = await fetchApi(`/api/Pagamentos/Pagamentos-Empresa/${comercioId}`, {
        skipToast: true,
        notFoundAsEmpty: true,
      });
      return Array.isArray(data) ? (data as T[]) : [];
    },
    enabled: Boolean(comercioId),
  });
}
