'use client';

import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoader } from '@/components/ui/page-loader';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  User,
  Phone,
  Mail,
  Scissors,
  Clock,
  DollarSign,
  FileText,
  UserCheck,
} from 'lucide-react';
import { queryKeys } from '@/lib/queryKeys';
import { useComercioId } from '@/hooks/useComercioId';
import {
  useAgendaComercio,
  useServicosComercio,
  useComercioUsuarios,
} from '@/hooks/useAdminQueries';
import { AppointmentForm } from '@/features/agenda/components/AppointmentForm';
import { Cliente } from '@/types';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { getUserIdFromToken } from '@/lib/apiHelpers';
import { fetchApi } from '@/lib/api';
import { getFriendlyErrorMessage } from '@/lib/errors';

interface AgendaItem {
  id: string;
  data: string;
  hora: string;
  servico: string;
  cliente: string;
  status: string;
  profissional?: string;
  profissionalId?: string;
  observacao?: string;
  duracao?: string;
  preco?: string | number;
  raw: Record<string, unknown>;
}

function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidValue(val: unknown): boolean {
  if (val === null || val === undefined) return false;
  const str = String(val).trim();
  if (!str) return false;
  const lower = str.toLowerCase();
  if (
    lower === 'undefined' ||
    lower === 'null' ||
    lower === 'string' ||
    lower === '[object object]'
  ) {
    return false;
  }
  return true;
}

function formatDuration(rawDuration: unknown): string | null {
  if (!isValidValue(rawDuration)) return null;
  const str = String(rawDuration).trim();
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
    const parts = str.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (h > 0 && m > 0) return `${h}h ${m}min`;
    if (h > 0) return `${h}h`;
    if (m > 0) return `${m} min`;
    return null;
  }
  const asNum = Number(str);
  if (!isNaN(asNum) && asNum > 0) {
    if (asNum >= 60 && asNum % 60 === 0) return `${asNum / 60}h`;
    if (asNum > 60) return `${Math.floor(asNum / 60)}h ${asNum % 60}min`;
    return `${asNum} min`;
  }
  return str;
}

function formatPrice(rawPrice: unknown): string | null {
  if (!isValidValue(rawPrice)) return null;
  if (typeof rawPrice === 'number') {
    return `R$ ${rawPrice.toFixed(2).replace('.', ',')}`;
  }
  const str = String(rawPrice).trim();
  if (str.startsWith('R$')) return str;
  const cleaned = str.replace(/[^\d.,]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  if (!isNaN(num)) {
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  }
  return str;
}

function mapAgendaItem(raw: Record<string, unknown>, index: number): AgendaItem {
  const servicoNome = String(
    raw.servicoNome ?? raw.ServicoNome ?? raw.servico ?? raw.Servico ?? 'Serviço'
  );
  const usuarioNome = String(
    raw.usuarioNome ??
      raw.UsuarioNome ??
      raw.clienteNome ??
      raw.ClienteNome ??
      raw.cliente ??
      raw.Cliente ??
      'Cliente'
  );
  const profissionalNome = String(
    raw.profissionalNome ??
      raw.ProfissionalNome ??
      raw.profissional ??
      raw.Profissional ??
      ''
  );
  const observacao = String(
    raw.observacao ?? raw.Observacao ?? raw.notas ?? raw.notes ?? ''
  );

  const valor = Number(raw.valor ?? raw.Valor);

  return {
    id: String(raw.id ?? raw.Id ?? index),
    data: String(raw.dataAgendamento ?? raw.DataAgendamento ?? raw.data ?? ''),
    hora: String(raw.horaAgendamento ?? raw.HoraAgendamento ?? raw.hora ?? '00:00:00'),
    servico: servicoNome,
    cliente: usuarioNome,
    status: String(raw.status ?? raw.Status ?? 'pendente').toLowerCase(),
    profissional: isValidValue(profissionalNome) ? profissionalNome : undefined,
    profissionalId: isValidValue(raw.profissionalId) ? String(raw.profissionalId) : undefined,
    observacao: isValidValue(observacao) ? observacao : undefined,
    duracao: isValidValue(raw.duracao ?? raw.Duracao) ? String(raw.duracao ?? raw.Duracao) : undefined,
    preco: valor > 0 ? valor : undefined,
    raw,
  };
}

export default function AdminAgendaPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { comercioId, isLoading: isLoadingComercio } = useComercioId();
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { data: rawList = [], isPending: isLoadingAgenda } = useAgendaComercio(comercioId);
  const { data: servicosList = [] } = useServicosComercio(comercioId);
  const { data: clientesList = [] } = useComercioUsuarios<Cliente>(comercioId, 'Clientes');

  const { userType, token } = useAuth();
  const isProfissional = userType === 'profissional';
  const meuId = token ? getUserIdFromToken(token) : null;
  const [somenteMeus, setSomenteMeus] = useState(true);

  const agendamentos = useMemo(() => {
    const all = rawList.map(mapAgendaItem);
    if (!isProfissional || !somenteMeus || !meuId) return all;
    return all.filter((a) => a.profissionalId?.toLowerCase() === meuId.toLowerCase());
  }, [rawList, isProfissional, somenteMeus, meuId]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedAppointmentForDetails, setSelectedAppointmentForDetails] = useState<AgendaItem | null>(null);

  const hours = Array.from({ length: 11 }, (_, i) => i + 8);

  const now = new Date();
  const todayDateStr = toLocalDateString(now);
  const currentDateStr = toLocalDateString(currentDate);
  const isViewingToday = currentDateStr === todayDateStr;
  const isViewingPastDay = currentDateStr < todayDateStr;

  const handleOpenModal = (date?: string, time?: string) => {
    const today = toLocalDateString(new Date());
    const safeDate = date && date >= today ? date : today;
    setSelectedDate(safeDate);
    setSelectedTime(time || '');
    setIsModalOpen(true);
  };

  const refreshAgenda = () => {
    if (comercioId) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.agendaComercio(comercioId) });
    }
  };

  /** `DELETE /api/Agenda/Comercio-Cancela/{id}` com corpo `true` (Admin e Profissional). */
  const handleCancelAppointment = async () => {
    if (!selectedAppointmentForDetails) return;
    setIsCancelling(true);
    try {
      await fetchApi(`/api/Agenda/Comercio-Cancela/${selectedAppointmentForDetails.id}`, {
        method: 'DELETE',
        body: 'true',
        skipToast: true,
      });
      toast.success('Agendamento cancelado.');
      setIsCancelConfirmOpen(false);
      setSelectedAppointmentForDetails(null);
      refreshAgenda();
    } catch (err: unknown) {
      toast.error(getFriendlyErrorMessage(err, 'Não foi possível cancelar o agendamento.'));
    } finally {
      setIsCancelling(false);
    }
  };

  const dayAppointments = useMemo(() => {
    return agendamentos.filter((a) => {
      if (!a.data) return false;
      const appointmentDate = new Date(a.data);
      return appointmentDate.toDateString() === currentDate.toDateString();
    });
  }, [agendamentos, currentDate]);

  // Detalhes enriquecidos do agendamento selecionado
  const enrichedAppointmentDetails = useMemo(() => {
    if (!selectedAppointmentForDetails) return null;
    const item = selectedAppointmentForDetails;

    // Buscar serviço correspondente para obter preço/duração caso o item não tenha
    const matchedService = (servicosList as Record<string, unknown>[]).find((s) => {
      const sName = String(s.nome ?? s.Nome ?? '').trim().toLowerCase();
      const aName = item.servico.trim().toLowerCase();
      return sName && aName && sName === aName;
    });

    // Buscar cliente correspondente para obter telefone/email
    const matchedClient = (clientesList as (Cliente & Record<string, unknown>)[]).find((c) => {
      const cId = String(c.id ?? c.Id ?? '');
      const appId = String(item.raw.usuarioId ?? item.raw.UsuarioId ?? '');
      if (cId && appId && cId.toLowerCase() === appId.toLowerCase()) return true;

      const cName = String(c.nome ?? c.Nome ?? '').trim().toLowerCase();
      const aName = item.cliente.trim().toLowerCase();
      return cName && aName && cName === aName;
    });

    const clientPhone = matchedClient?.telefone ?? item.raw.telefone ?? item.raw.Telefone ?? item.raw.phoneNumber;
    const clientEmail = matchedClient?.email ?? item.raw.email ?? item.raw.Email;

    const professionalName =
      item.profissional ??
      item.raw.profissionalNome ??
      item.raw.ProfissionalNome ??
      item.raw.nomeProfissional;

    const durationVal =
      item.duracao ??
      matchedService?.duracao ??
      matchedService?.Duracao ??
      matchedService?.tempoDuracao;

    const priceVal =
      item.preco ??
      matchedService?.preco ??
      matchedService?.Preco ??
      matchedService?.valor ??
      matchedService?.Valor;

    const notesVal = item.observacao ?? item.raw.observacao ?? item.raw.Observacao;

    // Formatar data em pt-BR
    let formattedDate = '';
    if (item.data) {
      const d = new Date(item.data);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    }

    return {
      id: item.id,
      cliente: isValidValue(item.cliente) ? item.cliente : 'Cliente',
      telefone: isValidValue(clientPhone) ? String(clientPhone) : null,
      email: isValidValue(clientEmail) ? String(clientEmail) : null,
      servico: isValidValue(item.servico) ? item.servico : 'Serviço',
      profissional: isValidValue(professionalName) ? String(professionalName) : null,
      dataFormatted: formattedDate || item.data,
      hora: item.hora.slice(0, 5),
      duracao: formatDuration(durationVal),
      preco: formatPrice(priceVal),
      status: item.status,
      notes: isValidValue(notesVal) ? String(notesVal) : null,
    };
  }, [selectedAppointmentForDetails, servicosList, clientesList]);

  if (isLoadingComercio || isLoadingAgenda) {
    return <PageLoader label="Carregando agenda..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Agenda" description="Gerencie seus agendamentos diários.">
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </PageHeader>

      {isProfissional && (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={somenteMeus ? 'default' : 'outline'}
            onClick={() => setSomenteMeus(true)}
          >
            Só os meus
          </Button>
          <Button
            type="button"
            size="sm"
            variant={somenteMeus ? 'outline' : 'default'}
            onClick={() => setSomenteMeus(false)}
          >
            Equipe toda
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate((d) => new Date(d.setDate(d.getDate() - 1)))}
              aria-label="Dia anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-base font-semibold text-foreground capitalize min-w-[200px] text-center">
              {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate((d) => new Date(d.setDate(d.getDate() + 1)))}
              aria-label="Próximo dia"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            Hoje
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {hours.map((hour) => {
              const hourAppointments = dayAppointments.filter(
                (a) => parseInt(a.hora.split(':')[0], 10) === hour
              );

              // Bloqueio de horários passados no dia atual ou dias anteriores
              const isPastSlot = isViewingPastDay || (isViewingToday && hour < now.getHours());

              return (
                <div key={hour} className="flex min-h-[72px] border-t border-border pt-3 first:border-t-0">
                  <div className="w-14 flex-shrink-0 text-right text-xs font-semibold text-muted-foreground pr-4 pt-1">
                    {hour}:00
                  </div>
                  <div className="flex-1 space-y-2">
                    {hourAppointments.length > 0 ? (
                      hourAppointments.map((agendamento) => (
                        <div
                          key={agendamento.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedAppointmentForDetails(agendamento)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedAppointmentForDetails(agendamento);
                            }
                          }}
                          className="rounded-xl bg-primary/5 border border-primary/15 p-3 transition-all hover:border-primary/40 hover:bg-primary/10 hover:shadow-sm cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                          title="Clique para ver os detalhes do agendamento"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="text-sm font-semibold text-foreground">{agendamento.servico}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {agendamento.cliente} • {agendamento.hora.slice(0, 5)}
                                {agendamento.profissional ? ` • com ${agendamento.profissional}` : ''}
                              </p>
                            </div>
                            <StatusBadge label={agendamento.status} variant={getStatusVariant(agendamento.status)} />
                          </div>
                        </div>
                      ))
                    ) : isPastSlot ? (
                      <div
                        className="h-12 w-full rounded-xl border border-dashed border-border/40 bg-muted/10 flex items-center justify-center opacity-40 select-none"
                        title="Horário passado — não é permitido agendar no passado"
                      >
                        <span className="text-xs text-muted-foreground/80 font-medium">Horário indisponível</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="h-12 w-full rounded-xl border border-dashed border-border bg-muted/20 flex items-center justify-center opacity-60 hover:opacity-100 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
                        onClick={() =>
                          handleOpenModal(
                            toLocalDateString(currentDate),
                            `${hour.toString().padStart(2, '0')}:00`
                          )
                        }
                      >
                        <span className="text-xs text-muted-foreground font-medium">+ Adicionar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Agendamento */}
      <Modal
        isOpen={Boolean(selectedAppointmentForDetails)}
        onClose={() => setSelectedAppointmentForDetails(null)}
        title="Detalhes do Agendamento"
        size="md"
      >
        {enrichedAppointmentDetails && (
          <div className="space-y-5 py-1">
            {/* Status e Serviço Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {enrichedAppointmentDetails.servico}
                </h3>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">
                  {enrichedAppointmentDetails.dataFormatted} às {enrichedAppointmentDetails.hora}
                </p>
              </div>
              <StatusBadge
                label={enrichedAppointmentDetails.status}
                variant={getStatusVariant(enrichedAppointmentDetails.status)}
              />
            </div>

            {/* Grid de Informações */}
            <div className="space-y-3.5 text-sm">
              {/* Cliente */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground font-medium block">Cliente</span>
                  <span className="font-semibold text-foreground block truncate">
                    {enrichedAppointmentDetails.cliente}
                  </span>
                  {enrichedAppointmentDetails.telefone && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <Phone className="h-3 w-3" />
                      <span>{enrichedAppointmentDetails.telefone}</span>
                    </div>
                  )}
                  {enrichedAppointmentDetails.email && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{enrichedAppointmentDetails.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Profissional (se disponível) */}
              {enrichedAppointmentDetails.profissional && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground font-medium block">Profissional</span>
                    <span className="font-medium text-foreground block">
                      {enrichedAppointmentDetails.profissional}
                    </span>
                  </div>
                </div>
              )}

              {/* Duração & Preço (se disponíveis) */}
              {(enrichedAppointmentDetails.duracao || enrichedAppointmentDetails.preco) && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {enrichedAppointmentDetails.duracao && (
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-xs text-muted-foreground block">Duração</span>
                        <span className="font-medium text-foreground text-xs">
                          {enrichedAppointmentDetails.duracao}
                        </span>
                      </div>
                    </div>
                  )}
                  {enrichedAppointmentDetails.preco && (
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-xs text-muted-foreground block">Valor</span>
                        <span className="font-medium text-foreground text-xs">
                          {enrichedAppointmentDetails.preco}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Observações / Notas (se disponíveis) */}
              {enrichedAppointmentDetails.notes && (
                <div className="flex items-start gap-3 pt-1">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-muted-foreground font-medium block">Observações</span>
                    <p className="text-xs text-foreground bg-muted/30 p-2.5 rounded-xl border border-border mt-1 whitespace-pre-wrap">
                      {enrichedAppointmentDetails.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="pt-3 flex justify-end gap-2 border-t border-border">
              {!/cancel|conclu/i.test(enrichedAppointmentDetails.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCancelConfirmOpen(true)}
                  className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-500/10"
                >
                  Cancelar agendamento
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAppointmentForDetails(null)}
                className="rounded-xl"
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={handleCancelAppointment}
        title="Cancelar agendamento?"
        description="O horário volta a ficar livre na agenda. Essa ação não pode ser desfeita."
        confirmLabel="Cancelar agendamento"
        cancelLabel="Voltar"
        variant="destructive"
        isLoading={isCancelling}
      />

      {/* Modal de Novo Agendamento */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Agendamento" size="lg">
        <AppointmentForm
          onSuccess={() => { setIsModalOpen(false); refreshAgenda(); }}
          onCancel={() => setIsModalOpen(false)}
          initialData={selectedDate}
          initialTime={selectedTime}
        />
      </Modal>
    </div>
  );
}
