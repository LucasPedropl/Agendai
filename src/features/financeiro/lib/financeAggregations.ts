import { getPaymentMethodLabel, mapPaymentStatusToUi, type UiPaymentStatus } from '@/lib/paymentEnums';

type ApiId = string | number;

export interface FinancePayment {
  id?: ApiId;
  Id?: ApiId;
  agendamentoId?: ApiId;
  AgendamentoId?: ApiId;
  valor?: number;
  Valor?: number;
  dataPagamento?: string | null;
  DataPagamento?: string | null;
  dataCriacao?: string;
  DataCriacao?: string;
  descricao?: string;
  Descricao?: string;
  statusPagamento?: number;
  StatusPagamento?: number;
  metodoPagamento?: number;
  MetodoPagamento?: number;
}

export interface FinanceService {
  id?: ApiId;
  Id?: ApiId;
  nome?: string;
  Nome?: string;
  preco?: number;
  Preco?: number;
}

export interface PerformedService {
  key: string;
  appointmentId?: string;
  serviceId?: string;
  serviceName: string;
  clientName?: string;
  professionalId?: string;
  professionalName?: string;
  date?: string;
  value: number;
}

export type TransactionStatus = UiPaymentStatus | 'performed';
export type StatusFilter = 'all' | TransactionStatus;

export interface FinanceTransaction extends Omit<PerformedService, 'key'> {
  key: string;
  paymentId?: string;
  description: string;
  status: TransactionStatus;
  isPerformed: boolean;
}

export interface RevenueRanking {
  key: string;
  name: string;
  value: number;
  count: number;
}

export const UNKNOWN_SERVICE_NAME = 'Serviço não informado';

function text(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  return String(value).trim() || undefined;
}

function amount(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function normalized(value: unknown): string {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f\s_-]/g, '').toLowerCase();
}

// Appointment dates are calendar dates; avoid shifting a date-only value to the previous day.
export function financeDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function buildPerformedServices(
  history: readonly Record<string, unknown>[],
  agenda: readonly Record<string, unknown>[],
  services: readonly FinanceService[],
  now: Date,
): PerformedService[] {
  const byId = new Map(services.map(service => [text(service.id ?? service.Id), service]));
  const byName = new Map(services.map(service => [normalized(service.nome ?? service.Nome), service]));
  const result: PerformedService[] = [];
  const seen = new Set<string>();
  const today = `${monthKey(now)}-${String(now.getDate()).padStart(2, '0')}`;

  const add = (item: Record<string, unknown>, source: string, index: number) => {
    const appointmentId = text(item.id ?? item.Id);
    if (appointmentId && seen.has(appointmentId)) return;
    if (appointmentId) seen.add(appointmentId);
    const serviceId = text(item.servicoId ?? item.ServicoId);
    const name = text(item.servicoNome ?? item.ServicoNome);
    const service = (serviceId ? byId.get(serviceId) : undefined) ?? byName.get(normalized(name));
    result.push({
      key: appointmentId ? `appointment-${appointmentId}` : `${source}-${index}`,
      appointmentId,
      serviceId: serviceId ?? text(service?.id ?? service?.Id),
      serviceName: name ?? text(service?.nome ?? service?.Nome) ?? UNKNOWN_SERVICE_NAME,
      clientName: text(item.usuarioNome ?? item.UsuarioNome ?? item.clienteNome ?? item.ClienteNome),
      professionalId: text(item.profissionalId ?? item.ProfissionalId),
      professionalName: text(item.profissionalNome ?? item.ProfissionalNome),
      date: text(item.dataAgendamento ?? item.DataAgendamento),
      value: amount(item.valor ?? item.Valor) || amount(service?.preco ?? service?.Preco),
    });
  };

  const isExcluded = (item: Record<string, unknown>) => {
    const status = normalized(item.status ?? item.Status);
    return status.includes('cancel') || status.includes('naocompareceu');
  };
  history.forEach((item, index) => {
    if (!isExcluded(item)) add(item, 'history', index);
  });
  agenda.forEach((item, index) => {
    if (isExcluded(item)) return;
    const day = text(item.dataAgendamento ?? item.DataAgendamento)?.slice(0, 10);
    const time = /^(\d{1,2}):(\d{2})/.exec(String(item.horaAgendamento ?? item.HoraAgendamento ?? ''));
    if (day !== today || !time) return;
    const hours = Number(time[1]);
    const minutes = Number(time[2]);
    if (hours > 23 || minutes > 59 || hours * 60 + minutes > now.getHours() * 60 + now.getMinutes()) return;
    add(item, 'agenda', index);
  });
  return result;
}

function rankRevenue(entries: readonly PerformedService[], by: 'service' | 'professional'): RevenueRanking[] {
  const groups = new Map<string, RevenueRanking>();
  for (const entry of entries) {
    const name = by === 'service' ? entry.serviceName : entry.professionalName;
    if (!name || (by === 'service' && name === UNKNOWN_SERVICE_NAME)) continue;
    const id = by === 'service' ? entry.serviceId : entry.professionalId;
    const key = id ? `id-${id}` : `name-${normalized(name)}`;
    const group = groups.get(key) ?? { key, name, value: 0, count: 0 };
    group.value += entry.value;
    group.count += 1;
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, 'pt-BR')).slice(0, 5);
}

export function buildFinanceSummary(
  performed: readonly PerformedService[],
  payments: readonly FinancePayment[],
  now: Date,
) {
  const performedById = new Map(performed.filter(entry => entry.appointmentId).map(entry => [entry.appointmentId, entry]));
  const linkedIds = new Set<string>();
  const revenueEntries = [...performed];
  const methods = new Map<string, number>();
  let totalReceived = 0;
  let paidCount = 0;

  const transactions: FinanceTransaction[] = payments.map((payment, index) => {
    const appointmentId = text(payment.agendamentoId ?? payment.AgendamentoId);
    const service = appointmentId ? performedById.get(appointmentId) : undefined;
    if (appointmentId) linkedIds.add(appointmentId);
    const paymentId = text(payment.id ?? payment.Id);
    const value = amount(payment.valor ?? payment.Valor);
    const status = mapPaymentStatusToUi(Number(payment.statusPagamento ?? payment.StatusPagamento));
    const date = text(payment.dataPagamento ?? payment.DataPagamento ?? payment.dataCriacao ?? payment.DataCriacao) ?? service?.date;
    const transaction: FinanceTransaction = {
      ...service,
      key: `payment-${paymentId ?? index}`,
      paymentId,
      appointmentId,
      serviceName: service?.serviceName ?? UNKNOWN_SERVICE_NAME,
      description: text(payment.descricao ?? payment.Descricao) ?? 'Pagamento de agendamento',
      date,
      value,
      status,
      isPerformed: Boolean(service),
    };
    if (status === 'pago') {
      totalReceived += value;
      paidCount += 1;
      const rawMethod = payment.metodoPagamento ?? payment.MetodoPagamento;
      const method = rawMethod == null ? 'Não informado' : getPaymentMethodLabel(Number(rawMethod));
      methods.set(method, (methods.get(method) ?? 0) + value);
      // Performed services already contribute their service value, regardless of payment status.
      if (!service) revenueEntries.push(transaction);
    }
    return transaction;
  });

  for (const service of performed) {
    if (service.appointmentId && linkedIds.has(service.appointmentId)) continue;
    transactions.push({ ...service, description: service.serviceName, status: 'performed', isPerformed: true });
  }
  transactions.sort((a, b) => (financeDate(b.date)?.getTime() ?? 0) - (financeDate(a.date)?.getTime() ?? 0));

  const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    return { key: monthKey(date), name: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), value: 0 };
  });
  for (const entry of revenueEntries) {
    const date = financeDate(entry.date);
    const month = date ? monthlyRevenue.find(item => item.key === monthKey(date)) : undefined;
    if (month) month.value += entry.value;
  }
  const performedTotal = performed.reduce((total, service) => total + service.value, 0);
  return {
    transactions,
    monthlyRevenue,
    serviceRanking: rankRevenue(revenueEntries, 'service'),
    professionalRanking: rankRevenue(revenueEntries, 'professional'),
    paymentMethods: [...methods].filter(([, value]) => value > 0).map(([name, value]) => ({ name, value })),
    totalReceived,
    paidCount,
    performedTotal,
    performedCount: performed.length,
    averageTicket: performed.length ? performedTotal / performed.length : 0,
  };
}

export function filterFinanceTransactions(transactions: readonly FinanceTransaction[], search: string, status: StatusFilter): FinanceTransaction[] {
  const term = normalized(search);
  return transactions.filter(transaction => {
    const matchesStatus = status === 'all' || (status === 'performed' ? transaction.isPerformed : transaction.status === status);
    const searchable = [transaction.description, transaction.serviceName, transaction.clientName, transaction.professionalName,
      transaction.appointmentId, transaction.paymentId, transaction.value].join(' ');
    return matchesStatus && (!term || normalized(searchable).includes(term));
  });
}
