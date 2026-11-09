import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import {
  buildComercioHistoricoPath,
  fetchComercioUsuariosList,
  getHistoricoPeriodoAtual,
  normalizeApiList,
} from '@/lib/apiHelpers';

export interface RawDashboardAgendaItem {
  id?: number | string;
  Id?: number | string;
  dataAgendamento?: string;
  DataAgendamento?: string;
  horaAgendamento?: string;
  HoraAgendamento?: string;
  servicoNome?: string;
  ServicoNome?: string;
  usuarioNome?: string;
  UsuarioNome?: string;
  status?: string;
  Status?: string;
}

export interface RawDashboardServico {
  id?: number;
  Id?: number;
  nome?: string;
  Nome?: string;
  preco?: number;
  Preco?: number;
  duracao?: string;
  Duracao?: string;
}

export interface RawDashboardPagamento {
  id?: number | string;
  Id?: number | string;
  valor?: number;
  Valor?: number;
  statusPagamento?: number;
  StatusPagamento?: number;
  dataPagamento?: string | null;
  DataPagamento?: string | null;
  dataCriacao?: string;
  DataCriacao?: string;
}

export interface RawDashboardCliente {
  id?: string;
  Id?: string;
  nome?: string;
  Nome?: string;
  email?: string;
  Email?: string;
  telefone?: string;
  Telefone?: string;
  ultimaVisita?: string;
  UltimaVisita?: string;
}

export interface DashboardMetrics {
  receitaMes: number;
  receitaMesAnterior: number;
  receitaCrescimentoPercentual: number | null;
  agendamentosHoje: number;
  agendamentosHojeConcluidos: number;
  taxaConclusaoHoje: number;
  clientesTotal: number;
  clientesSemana: number;
  taxaCancelamento: number;
  totalAgendamentosMes: number;
  totalCanceladosMes: number;
}

export interface WeeklyFlowDay {
  name: string;
  dataCompleta: string;
  receita: number;
  cancelamentos: number;
  total: number;
}

export interface UpcomingAppointment {
  id: string;
  data: string;
  horario: string;
  cliente: string;
  servico: string;
  valor: number;
  status: string;
  isToday: boolean;
}

export interface UseDashboardDataParams {
  comercioId: number | null;
  isProfissional: boolean;
  profissionalId?: string | null;
}

export interface UseDashboardDataReturn {
  metrics: DashboardMetrics;
  weeklyFlow: WeeklyFlowDay[];
  upcomingAppointments: UpcomingAppointment[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  errorMessage: string | null;
  refetch: () => Promise<void>;
  hasData: boolean;
}

function extractDateStr(rawDate: string | undefined | null): string {
  if (!rawDate) return '';
  return rawDate.slice(0, 10);
}

function formatHourMinute(rawTime: string | undefined | null): string {
  if (!rawTime) return '00:00';
  const parts = rawTime.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return rawTime.slice(0, 5);
}

function getPreviousPeriod(currentPeriodStr: string): string {
  const current = parseInt(currentPeriodStr, 10);
  if (isNaN(current) || current <= 1) return '12';
  return String(current - 1);
}

function getWeekDates(): { name: string; dateStr: string }[] {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Segunda, ...
  const distToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + distToMonday);

  const dayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return {
      name: dayLabels[i],
      dateStr: `${y}-${m}-${day}`,
    };
  });
}

function isDateToday(rawDate: string | undefined | null): boolean {
  if (!rawDate) return false;
  const target = extractDateStr(rawDate);
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return target === `${y}-${m}-${d}`;
}

export function useDashboardData({
  comercioId,
  isProfissional,
  profissionalId,
}: UseDashboardDataParams): UseDashboardDataReturn {
  const queryClient = useQueryClient();
  const currentPeriod = getHistoricoPeriodoAtual();
  const prevPeriod = getPreviousPeriod(currentPeriod);
  const enabled = Boolean(comercioId);

  // 1. Agenda (agendamentos futuros e de hoje)
  const agendaQuery = useQuery({
    queryKey: ['dashboard', 'agenda', comercioId],
    queryFn: async () => {
      const data = await fetchApi(`/api/Agenda/Comercio/${comercioId}`, { skipToast: true });
      return normalizeApiList<RawDashboardAgendaItem>(data, ['Agenda Vazia']);
    },
    enabled,
    staleTime: 30 * 1000,
  });

  // 2. Histórico do Mês Atual (para faturamento e cancelamentos do mês)
  const historicoMesAtualQuery = useQuery({
    queryKey: ['dashboard', 'historico', comercioId, currentPeriod, isProfissional ? profissionalId : 'all'],
    queryFn: async () => {
      const path = buildComercioHistoricoPath({
        comercioId: comercioId!,
        periodo: currentPeriod,
        profissionalId: isProfissional ? profissionalId : null,
      });
      const data = await fetchApi(path, { skipToast: true });
      return normalizeApiList<RawDashboardAgendaItem>(data, ['Histórico Vazio']);
    },
    enabled,
    staleTime: 60 * 1000,
  });

  // 3. Histórico do Mês Anterior (para comparar crescimento de receita)
  const historicoMesAnteriorQuery = useQuery({
    queryKey: ['dashboard', 'historico', comercioId, prevPeriod, isProfissional ? profissionalId : 'all'],
    queryFn: async () => {
      const path = buildComercioHistoricoPath({
        comercioId: comercioId!,
        periodo: prevPeriod,
        profissionalId: isProfissional ? profissionalId : null,
      });
      const data = await fetchApi(path, { skipToast: true });
      return normalizeApiList<RawDashboardAgendaItem>(data, ['Histórico Vazio']);
    },
    enabled,
    staleTime: 120 * 1000,
  });

  // 4. Serviços cadastrados (para obter preço de cada serviço)
  const servicosQuery = useQuery({
    queryKey: ['dashboard', 'servicos', comercioId],
    queryFn: async () => {
      const data = await fetchApi(`/api/Servicos/Todos/${comercioId}`, { skipToast: true });
      return normalizeApiList<RawDashboardServico>(data);
    },
    enabled,
    staleTime: 60 * 1000,
  });

  // 5. Clientes cadastrados
  const clientesQuery = useQuery({
    queryKey: ['dashboard', 'clientes', comercioId],
    queryFn: () => fetchComercioUsuariosList<RawDashboardCliente>(fetchApi, 'Clientes', comercioId!),
    enabled,
    staleTime: 60 * 1000,
  });

  // 6. Pagamentos da Empresa
  const pagamentosQuery = useQuery({
    queryKey: ['dashboard', 'pagamentos', comercioId],
    queryFn: async () => {
      const data = await fetchApi(`/api/Pagamentos/Pagamentos-Empresa/${comercioId}`, {
        skipToast: true,
        notFoundAsEmpty: true,
      });
      return Array.isArray(data) ? (data as RawDashboardPagamento[]) : [];
    },
    enabled,
    staleTime: 60 * 1000,
  });

  const isLoading =
    agendaQuery.isPending ||
    historicoMesAtualQuery.isPending ||
    servicosQuery.isPending ||
    clientesQuery.isPending;

  const isFetching =
    agendaQuery.isFetching ||
    historicoMesAtualQuery.isFetching ||
    historicoMesAnteriorQuery.isFetching ||
    servicosQuery.isFetching ||
    clientesQuery.isFetching ||
    pagamentosQuery.isFetching;

  const isError =
    agendaQuery.isError ||
    historicoMesAtualQuery.isError ||
    servicosQuery.isError ||
    clientesQuery.isError;

  const errorMessage =
    agendaQuery.error?.message ||
    historicoMesAtualQuery.error?.message ||
    servicosQuery.error?.message ||
    clientesQuery.error?.message ||
    null;

  // Mapa de Preço por Nome do Serviço
  const servicePriceMap = useMemo(() => {
    const map = new Map<string, number>();
    const list = servicosQuery.data ?? [];
    for (const item of list) {
      const name = item.nome ?? item.Nome;
      const price = Number(item.preco ?? item.Preco ?? 0);
      if (name) {
        map.set(name.trim().toLowerCase(), price);
      }
    }
    return map;
  }, [servicosQuery.data]);

  const getServicePrice = (servicoNome: string | undefined): number => {
    if (!servicoNome) return 0;
    return servicePriceMap.get(servicoNome.trim().toLowerCase()) ?? 0;
  };

  // Cálculo das Métricas Principais
  const { metrics, weeklyFlow, upcomingAppointments, hasData } = useMemo(() => {
    const agendaList = agendaQuery.data ?? [];
    const histMesAtual = historicoMesAtualQuery.data ?? [];
    const histMesAnterior = historicoMesAnteriorQuery.data ?? [];
    const clientesList = clientesQuery.data ?? [];
    const pagamentosList = pagamentosQuery.data ?? [];

    const now = new Date();
    const currentMonthNum = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // 1. Receita do Mês Atual
    // Derivada de: agendamentos finalizados no histórico deste mês * preço do serviço
    // OU pagamentos com status Pago (1) no mês atual
    let receitaMesServicos = 0;
    for (const item of histMesAtual) {
      const st = String(item.status ?? item.Status ?? '').toLowerCase();
      if (st.includes('finaliz') || st.includes('conclu')) {
        const servName = item.servicoNome ?? item.ServicoNome;
        receitaMesServicos += getServicePrice(servName);
      }
    }

    let receitaMesPagamentos = 0;
    for (const pag of pagamentosList) {
      const statusNum = Number(pag.statusPagamento ?? pag.StatusPagamento ?? 0);
      const isPaid = statusNum === 1;
      const rawDate = pag.dataPagamento ?? pag.DataPagamento ?? pag.dataCriacao ?? pag.DataCriacao;
      if (isPaid && rawDate) {
        const pagDate = new Date(rawDate);
        if (!isNaN(pagDate.getTime())) {
          if (pagDate.getMonth() + 1 === currentMonthNum && pagDate.getFullYear() === currentYear) {
            receitaMesPagamentos += Number(pag.valor ?? pag.Valor ?? 0);
          }
        }
      }
    }

    // Utiliza o maior entre agendamentos finalizados e pagamentos para não perder registros
    const receitaMes = Math.max(receitaMesServicos, receitaMesPagamentos);

    // 2. Receita do Mês Anterior (para cálculo de crescimento percentual)
    let receitaMesAnterior = 0;
    for (const item of histMesAnterior) {
      const st = String(item.status ?? item.Status ?? '').toLowerCase();
      if (st.includes('finaliz') || st.includes('conclu')) {
        const servName = item.servicoNome ?? item.ServicoNome;
        receitaMesAnterior += getServicePrice(servName);
      }
    }

    let receitaCrescimentoPercentual: number | null = null;
    if (receitaMesAnterior > 0) {
      receitaCrescimentoPercentual = Math.round(
        ((receitaMes - receitaMesAnterior) / receitaMesAnterior) * 100
      );
    }

    // 3. Agendamentos Hoje
    const agendamentosHojeList = agendaList.filter((item) =>
      isDateToday(item.dataAgendamento ?? item.DataAgendamento)
    );
    const agendamentosHoje = agendamentosHojeList.length;

    // Concluídos hoje (presentes no histórico de hoje ou agenda marcada como finalizada)
    const concluidosHojeNaAgenda = agendamentosHojeList.filter((item) => {
      const st = String(item.status ?? item.Status ?? '').toLowerCase();
      return st.includes('finaliz') || st.includes('conclu');
    }).length;

    const concluidosHojeNoHist = histMesAtual.filter((item) => {
      const isToday = isDateToday(item.dataAgendamento ?? item.DataAgendamento);
      const st = String(item.status ?? item.Status ?? '').toLowerCase();
      return isToday && (st.includes('finaliz') || st.includes('conclu'));
    }).length;

    const agendamentosHojeConcluidos = Math.max(concluidosHojeNaAgenda, concluidosHojeNoHist);
    const taxaConclusaoHoje =
      agendamentosHoje > 0
        ? Math.round((agendamentosHojeConcluidos / agendamentosHoje) * 100)
        : 0;

    // 4. Clientes
    const clientesTotal = clientesList.length;

    // Clientes que têm agendamento nos últimos 7 dias ou nesta semana
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const sevenDaysAgoStr = extractDateStr(sevenDaysAgo.toISOString());

    const clientNamesWeek = new Set<string>();
    for (const item of [...agendaList, ...histMesAtual]) {
      const dStr = extractDateStr(item.dataAgendamento ?? item.DataAgendamento);
      if (dStr >= sevenDaysAgoStr) {
        const clientName = (item.usuarioNome ?? item.UsuarioNome ?? '').trim();
        if (clientName) clientNamesWeek.add(clientName.toLowerCase());
      }
    }
    const clientesSemana = clientNamesWeek.size;

    // 5. Taxa de Cancelamento no Mês
    // Considera todos os agendamentos registrados no mês atual (histórico + agenda)
    let canceladosMes = 0;
    let totalMes = 0;

    for (const item of histMesAtual) {
      totalMes += 1;
      const st = String(item.status ?? item.Status ?? '').toLowerCase();
      if (st.includes('cancel')) {
        canceladosMes += 1;
      }
    }

    for (const item of agendaList) {
      const d = item.dataAgendamento ?? item.DataAgendamento;
      if (d) {
        const itemDate = new Date(d);
        if (
          !isNaN(itemDate.getTime()) &&
          itemDate.getMonth() + 1 === currentMonthNum &&
          itemDate.getFullYear() === currentYear
        ) {
          totalMes += 1;
          const st = String(item.status ?? item.Status ?? '').toLowerCase();
          if (st.includes('cancel')) {
            canceladosMes += 1;
          }
        }
      }
    }

    const taxaCancelamento =
      totalMes > 0 ? Math.round((canceladosMes / totalMes) * 1000) / 10 : 0;

    const metricsResult: DashboardMetrics = {
      receitaMes,
      receitaMesAnterior,
      receitaCrescimentoPercentual,
      agendamentosHoje,
      agendamentosHojeConcluidos,
      taxaConclusaoHoje,
      clientesTotal,
      clientesSemana,
      taxaCancelamento,
      totalAgendamentosMes: totalMes,
      totalCanceladosMes: canceladosMes,
    };

    // 6. Fluxo Financeiro Semanal (Segunda a Domingo da semana atual)
    const weekDates = getWeekDates();
    const allAppointmentsForWeek = [...histMesAtual, ...agendaList];

    const weeklyFlowResult: WeeklyFlowDay[] = weekDates.map(({ name, dateStr }) => {
      let diaReceita = 0;
      let diaCancelamentos = 0;
      let diaTotal = 0;

      for (const item of allAppointmentsForWeek) {
        const itemDate = extractDateStr(item.dataAgendamento ?? item.DataAgendamento);
        if (itemDate === dateStr) {
          diaTotal += 1;
          const st = String(item.status ?? item.Status ?? '').toLowerCase();
          if (st.includes('cancel')) {
            diaCancelamentos += 1;
          } else if (st.includes('finaliz') || st.includes('conclu')) {
            const serv = item.servicoNome ?? item.ServicoNome;
            diaReceita += getServicePrice(serv);
          }
        }
      }

      // Adiciona pagamentos realizados nesta data, se houver
      let diaPagamentos = 0;
      for (const pag of pagamentosList) {
        const statusNum = Number(pag.statusPagamento ?? pag.StatusPagamento ?? 0);
        if (statusNum === 1) {
          const rawDate = pag.dataPagamento ?? pag.DataPagamento ?? pag.dataCriacao ?? pag.DataCriacao;
          if (rawDate && extractDateStr(rawDate) === dateStr) {
            diaPagamentos += Number(pag.valor ?? pag.Valor ?? 0);
          }
        }
      }

      diaReceita = Math.max(diaReceita, diaPagamentos);

      return {
        name,
        dataCompleta: dateStr,
        receita: diaReceita,
        cancelamentos: diaCancelamentos,
        total: diaTotal,
      };
    });

    // 7. Próximos Clientes (Top 5 agendamentos futuros ou de hoje ordenados por data/hora)
    const todayStr = extractDateStr(now.toISOString());
    const upcomingList = agendaList
      .filter((item) => {
        const d = extractDateStr(item.dataAgendamento ?? item.DataAgendamento);
        return d >= todayStr;
      })
      .sort((a, b) => {
        const dateA = extractDateStr(a.dataAgendamento ?? a.DataAgendamento);
        const dateB = extractDateStr(b.dataAgendamento ?? b.DataAgendamento);
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        const timeA = String(a.horaAgendamento ?? a.HoraAgendamento ?? '00:00:00');
        const timeB = String(b.horaAgendamento ?? b.HoraAgendamento ?? '00:00:00');
        return timeA.localeCompare(timeB);
      })
      .slice(0, 5)
      .map((item, index): UpcomingAppointment => {
        const id = String(item.id ?? item.Id ?? `agenda-${index}`);
        const dataStr = extractDateStr(item.dataAgendamento ?? item.DataAgendamento);
        const horario = formatHourMinute(item.horaAgendamento ?? item.HoraAgendamento);
        const cliente = String(item.usuarioNome ?? item.UsuarioNome ?? 'Cliente');
        const servico = String(item.servicoNome ?? item.ServicoNome ?? 'Serviço');
        const valor = getServicePrice(servico);
        const rawStatus = String(item.status ?? item.Status ?? 'Confirmado');

        return {
          id,
          data: dataStr,
          horario,
          cliente,
          servico,
          valor,
          status: rawStatus,
          isToday: isDateToday(item.dataAgendamento ?? item.DataAgendamento),
        };
      });

    const anyActivity =
      receitaMes > 0 ||
      totalMes > 0 ||
      agendamentosHoje > 0 ||
      clientesTotal > 0 ||
      upcomingList.length > 0;

    return {
      metrics: metricsResult,
      weeklyFlow: weeklyFlowResult,
      upcomingAppointments: upcomingList,
      hasData: anyActivity,
    };
  }, [
    agendaQuery.data,
    historicoMesAtualQuery.data,
    historicoMesAnteriorQuery.data,
    clientesQuery.data,
    pagamentosQuery.data,
    servicePriceMap,
  ]);

  const refetch = async () => {
    if (!comercioId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      agendaQuery.refetch(),
      historicoMesAtualQuery.refetch(),
      historicoMesAnteriorQuery.refetch(),
      servicosQuery.refetch(),
      clientesQuery.refetch(),
      pagamentosQuery.refetch(),
    ]);
  };

  return {
    metrics,
    weeklyFlow,
    upcomingAppointments,
    isLoading,
    isFetching,
    isError,
    errorMessage,
    refetch,
    hasData,
  };
}
