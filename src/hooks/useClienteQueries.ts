import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { normalizeApiList } from '@/lib/apiHelpers';
import { queryKeys } from '@/lib/queryKeys';

interface RawClienteAgendamento {
  id?: number | string;
  dataAgendamento?: string;
  servicoNome?: string;
  profissionalNome?: string;
  status?: string;
  valor?: number;
  [key: string]: unknown;
}

/**
 * `GET /api/Agenda/Cliente` — desde 09/09/2026 a API tira o usuário do JWT; a rota
 * antiga `/Cliente/{id}` não existe mais. `userId` sobrou apenas como chave de cache
 * (troca de conta na mesma aba não pode reaproveitar a lista anterior).
 *
 * BUG BACKEND CONHECIDO (AgendaController.cs:336):
 * O backend filtra `a.DataAgendamento > DateTime.UtcNow` para agendamentos futuros,
 * mas grava `DataAgendamento` como data pura (00:00:00). Com isso, agendamentos marcados
 * para o dia de HOJE são omitidos de `/api/Agenda/Cliente` e caem no `/api/Agenda/Cliente-Historico`
 * (`a.DataAgendamento < DateTime.UtcNow`).
 * Além disso, `AgendaView` não inclui `status` (que é sempre `Confirmado` na query da API).
 * Aqui consultamos ambos os endpoints com fallback seguro e mesclamos os agendamentos ativos de hoje.
 */
export function useClienteAgendamentos<T = Record<string, unknown>>(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.clienteAgendamentos(userId) : ['cliente', 'agendamentos', 'none'],
    queryFn: async () => {
      const [futurosRaw, historicoRaw] = await Promise.all([
        // Erro aqui tem de virar estado de erro na tela, não "nenhum agendamento".
        fetchApi('/api/Agenda/Cliente', { notFoundAsEmpty: true }),
        fetchApi('/api/Agenda/Cliente-Historico', { notFoundAsEmpty: true, skipToast: true }).catch(() => []),
      ]);

      const futuros = normalizeApiList<RawClienteAgendamento>(futurosRaw, ['Agenda Vazia']);
      const historico = normalizeApiList<RawClienteAgendamento>(historicoRaw, ['Histórico Vazio', 'Agenda Vazia']);

      const mappedFuturos: RawClienteAgendamento[] = futuros.map((item) => ({
        status: 'Confirmado',
        profissionalNome: 'Profissional',
        ...item,
      }));

      const activeIds = new Set(
        mappedFuturos
          .map((f) => f.id)
          .filter((id): id is string | number => id !== undefined)
      );

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hojeDateStr = `${year}-${month}-${day}`;

      const hojeDoHistorico: RawClienteAgendamento[] = historico
        .filter((h) => {
          if (!h || (h.id !== undefined && activeIds.has(h.id))) return false;
          const rawDate = typeof h.dataAgendamento === 'string' ? h.dataAgendamento : '';
          const itemDateStr = rawDate.split('T')[0];
          const status = String(h.status || '').toLowerCase();
          const isAtivo = status === 'confirmado' || status === 'pendente';
          return isAtivo && (itemDateStr === hojeDateStr || new Date(rawDate) >= new Date(hojeDateStr));
        })
        .map((h) => ({
          profissionalNome: 'Profissional',
          ...h,
          status: h.status || 'Confirmado',
        }));

      const combined: RawClienteAgendamento[] = [...hojeDoHistorico, ...mappedFuturos];

      combined.sort((a, b) => {
        const da = a.dataAgendamento ? new Date(a.dataAgendamento).getTime() : 0;
        const db = b.dataAgendamento ? new Date(b.dataAgendamento).getTime() : 0;
        return da - db;
      });

      return combined as T[];
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
