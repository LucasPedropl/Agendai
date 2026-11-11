import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { normalizeApiList } from '@/lib/apiHelpers';
import { queryKeys } from '@/lib/queryKeys';

interface RawClienteAgendamento {
  id?: number | string;
  dataAgendamento?: string;
  horaAgendamento?: string;
  servicoId?: number;
  servicoNome?: string;
  valor?: number;
  profissionalId?: string;
  profissionalNome?: string;
  comercioId?: number;
  comercioNome?: string;
  estabelecimento?: string;
  status?: string;
  [key: string]: unknown;
}

/**
 * `GET /api/Agenda/Cliente` — agendamentos de hoje em diante (Pendente/Confirmado),
 * já ordenados por data e hora. A API tira o usuário do JWT; `userId` serve apenas
 * como chave de cache (troca de conta na mesma aba não pode reaproveitar a lista anterior).
 */
export function useClienteAgendamentos<T = Record<string, unknown>>(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.clienteAgendamentos(userId) : ['cliente', 'agendamentos', 'none'],
    queryFn: async () => {
      // Erro aqui tem de virar estado de erro na tela, não "nenhum agendamento".
      const raw = await fetchApi('/api/Agenda/Cliente', { notFoundAsEmpty: true });
      const items = normalizeApiList<RawClienteAgendamento>(raw, ['Agenda Vazia']);

      const sorted = [...items].sort((a, b) => {
        const da = a.dataAgendamento ? a.dataAgendamento.split('T')[0] : '';
        const db = b.dataAgendamento ? b.dataAgendamento.split('T')[0] : '';
        if (da !== db) return da < db ? -1 : 1;
        const ha = a.horaAgendamento ?? '';
        const hb = b.horaAgendamento ?? '';
        return ha < hb ? -1 : ha > hb ? 1 : 0;
      });

      return sorted as T[];
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

interface RawComercioItem {
  id?: number | string;
  idComercio?: number | string;
  nome?: string | null;
  [key: string]: unknown;
}

export async function fetchComerciosAgendaveis(): Promise<unknown[]> {
  const firstPage = await fetchApi('/api/Comercios?pagina=1&qtdPagina=100', {
    method: 'GET',
    skipToast: true,
  });

  let totalPaginas = 1;
  if (firstPage && typeof firstPage === 'object' && 'totalPaginas' in firstPage) {
    const tp = Number((firstPage as Record<string, unknown>).totalPaginas);
    if (Number.isFinite(tp) && tp >= 1) {
      totalPaginas = Math.floor(tp);
    }
  }

  const allItems: unknown[] = [...normalizeApiList<unknown>(firstPage)];

  if (totalPaginas > 1) {
    const pagePromises: Promise<unknown[]>[] = [];
    for (let p = 2; p <= totalPaginas; p++) {
      pagePromises.push(
        fetchApi(`/api/Comercios?pagina=${p}&qtdPagina=100`, { method: 'GET', skipToast: true })
          .then((pageData) => normalizeApiList<unknown>(pageData))
          .catch(() => [])
      );
    }
    const otherPages = await Promise.all(pagePromises);
    for (const pageItems of otherPages) {
      allItems.push(...pageItems);
    }
  }

  const namedItems = allItems.filter((item): item is RawComercioItem => {
    if (!item || typeof item !== 'object') return false;
    const nome = (item as RawComercioItem).nome;
    return typeof nome === 'string' && nome.trim().length > 0;
  });

  const checks = await Promise.all(
    namedItems.map(async (item) => {
      const id = item.id ?? item.idComercio;
      if (id === undefined || id === null) {
        return false;
      }
      try {
        const services = await fetchApi(`/api/Servicos/Todos/${id}`, {
          method: 'GET',
          skipToast: true,
          notFoundAsEmpty: true,
        });
        return Array.isArray(services) && services.length > 0;
      } catch {
        return true;
      }
    })
  );

  return namedItems.filter((_, index) => checks[index]);
}

export function useComerciosPublicos<T = unknown>() {
  return useQuery({
    queryKey: queryKeys.comerciosPublicos,
    queryFn: () => fetchComerciosAgendaveis() as Promise<T[]>,
    staleTime: 5 * 60 * 1000,
  });
}

export function useClientePagamentos() {
  return useQuery({
    queryKey: queryKeys.clientePagamentos('self'),
    queryFn: async () => {
      const data = await fetchApi('/api/Pagamentos/Pagamentos-Cliente', { skipToast: true, notFoundAsEmpty: true });
      return Array.isArray(data) ? data : [];
    },
  });
}
