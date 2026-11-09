import { useQuery, useQueries } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { normalizeApiList } from '@/lib/apiHelpers';
import { matchesCity } from '@/lib/comercioLocation';
import { Estabelecimento, Servico, Profissional } from '../types';

interface RawComercioResponse {
  totalItens?: number;
  totalPaginas?: number;
  dados?: Estabelecimento[];
}

interface BookableCheckResult {
  isBookable: boolean;
  reason?: string;
}

/**
 * Critério para mostrar um comércio na lista de agendamento:
 * 1. Tem ao menos um serviço (GET /api/Servicos/Todos/:id)
 * 2. Tem ao menos um profissional que aceita agendamento (GET /api/ComercioUsuarios/Profissionais-Agendar/:id)
 * 3. Para o primeiro serviço, algum dos primeiros profissionais (até 3) tem dia livre a partir de hoje
 *    no mês atual ou no seguinte (GET /api/Agenda/Agenda-Datas).
 * Se a API falhar (erro que não é "lista vazia"), o comércio continua visível: esconder por instabilidade
 * de rede seria pior do que mostrar um comércio sem horário.
 */
const MAX_PROFESSIONALS_TO_PROBE = 3;

async function fetchAgendaDays(
  comercioId: number,
  servicoId: number,
  profissionalId: number | string,
  year: number,
  month: number,
): Promise<number[]> {
  const query = new URLSearchParams({
    ano: String(year),
    mes: String(month),
    servicoId: String(servicoId),
    profissionalId: String(profissionalId),
    comercioId: String(comercioId),
  });
  const data = await fetchApi(`/api/Agenda/Agenda-Datas/?${query.toString()}`, {
    method: 'GET',
    skipToast: true,
    notFoundAsEmpty: true,
  });
  return Array.isArray(data) ? (data as number[]) : [];
}

export async function checkComercioBookable(comercioId: number): Promise<BookableCheckResult> {
  try {
    const [servicesData, profsData] = await Promise.all([
      fetchApi(`/api/Servicos/Todos/${comercioId}`, { method: 'GET', skipToast: true, notFoundAsEmpty: true }),
      fetchApi(`/api/ComercioUsuarios/Profissionais-Agendar/${comercioId}`, {
        method: 'GET',
        skipToast: true,
        notFoundAsEmpty: true,
      }),
    ]);

    const services = Array.isArray(servicesData) ? (servicesData as Servico[]) : [];
    const professionals = Array.isArray(profsData) ? (profsData as Profissional[]) : [];

    if (services.length === 0) return { isBookable: false, reason: 'Nenhum serviço disponível' };
    if (professionals.length === 0) return { isBookable: false, reason: 'Nenhum profissional cadastrado' };

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const nextMonthDate = new Date(currentYear, currentMonth, 1);
    const servicoId = services[0].id;

    for (const prof of professionals.slice(0, MAX_PROFESSIONALS_TO_PROBE)) {
      const currentDays = await fetchAgendaDays(comercioId, servicoId, prof.id, currentYear, currentMonth);
      if (currentDays.some((day) => day >= now.getDate())) return { isBookable: true };

      const nextDays = await fetchAgendaDays(
        comercioId,
        servicoId,
        prof.id,
        nextMonthDate.getFullYear(),
        nextMonthDate.getMonth() + 1,
      );
      if (nextDays.length > 0) return { isBookable: true };
    }

    return { isBookable: false, reason: 'Sem datas disponíveis na agenda' };
  } catch {
    return { isBookable: true, reason: 'Falha ao verificar disponibilidade — exibido por segurança' };
  }
}

async function fetchRawComerciosList(): Promise<Estabelecimento[]> {
  const firstPage = (await fetchApi('/api/Comercios?pagina=1&qtdPagina=100', {
    method: 'GET',
    skipToast: true,
  })) as RawComercioResponse | Estabelecimento[];

  let totalPaginas = 1;
  let items: Estabelecimento[] = [];

  if (firstPage && typeof firstPage === 'object' && 'dados' in firstPage && Array.isArray(firstPage.dados)) {
    items = firstPage.dados;
    const tp = Number(firstPage.totalPaginas);
    if (Number.isFinite(tp) && tp >= 1) {
      totalPaginas = Math.floor(tp);
    }
  } else {
    items = normalizeApiList<Estabelecimento>(firstPage);
  }

  if (totalPaginas > 1) {
    const pagePromises: Promise<Estabelecimento[]>[] = [];
    for (let p = 2; p <= totalPaginas; p++) {
      pagePromises.push(
        fetchApi(`/api/Comercios?pagina=${p}&qtdPagina=100`, { method: 'GET', skipToast: true })
          .then((res) => {
            const r = res as RawComercioResponse;
            return r?.dados && Array.isArray(r.dados) ? r.dados : normalizeApiList<Estabelecimento>(res);
          })
          .catch(() => [])
      );
    }
    const otherPages = await Promise.all(pagePromises);
    for (const pageItems of otherPages) {
      items.push(...pageItems);
    }
  }

  // Comércios sem nome são cadastros incompletos que quebram a busca
  return items.filter((item) => Boolean(item && typeof item.nome === 'string' && item.nome.trim().length > 0));
}

export function useEstablishments(searchTerm = '', cityFilter = '') {
  // 1. Busca lista de comércios brutos
  const { data: rawComercios = [], isLoading: isLoadingRaw } = useQuery({
    queryKey: ['comercios', 'all-raw'],
    queryFn: fetchRawComerciosList,
    staleTime: 5 * 60 * 1000,
  });

  // 2. Verifica agendabilidade de cada comércio em paralelo com React Query
  const bookableQueries = useQueries({
    queries: rawComercios.map((comercio) => ({
      queryKey: ['comercio-bookable', comercio.id],
      queryFn: () => checkComercioBookable(comercio.id),
      staleTime: 5 * 60 * 1000,
      enabled: Boolean(comercio.id),
    })),
  });

  const isCheckingBookable = bookableQueries.some((q) => q.isLoading);

  // Mapeia status de agendabilidade
  const bookableMap = new Map<number, boolean>();
  rawComercios.forEach((comercio, index) => {
    const query = bookableQueries[index];
    if (query?.data) {
      bookableMap.set(comercio.id, query.data.isBookable);
    }
  });

  // 3. Filtra apenas comércios que possuem horários agendáveis (isBookable === true)
  const bookableComercios = rawComercios.filter((comercio) => {
    // Se a query ainda não terminou de verificar, não exibimos se quisermos esconder os vazios
    return bookableMap.get(comercio.id) === true;
  });

  // 4. Aplica busca por texto e filtro de cidade (insensível a maiúsculas/acentos)
  const term = searchTerm.trim().toLowerCase();
  const filteredComercios = bookableComercios.filter((est) => {
    if (cityFilter && !matchesCity(est.endereco, cityFilter)) {
      return false;
    }
    if (!term) return true;
    const nomeMatch = (est.nome ?? '').toLowerCase().includes(term);
    const enderecoMatch = (est.endereco ?? '').toLowerCase().includes(term);
    return nomeMatch || enderecoMatch;
  });

  return {
    estabelecimentos: filteredComercios,
    allBookableEstabelecimentos: bookableComercios,
    // Mostra os comércios conforme cada checagem termina; só fica em "carregando" enquanto
    // nenhum foi confirmado ainda, para um comércio lento não travar a lista inteira.
    isLoading: isLoadingRaw || (bookableComercios.length === 0 && isCheckingBookable),
    isCheckingBookable,
  };
}
