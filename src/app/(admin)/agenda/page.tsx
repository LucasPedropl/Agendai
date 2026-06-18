'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoader } from '@/components/ui/page-loader';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, AlertCircle } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { IS_ADMIN_AGENDA_CLIENT_NAME_UNRELIABLE, normalizeApiList } from '@/lib/apiHelpers';
import { useComercioId } from '@/hooks/useComercioId';
import { AppointmentForm } from '@/features/agenda/components/AppointmentForm';

interface AgendaItem {
  id: string;
  data: string;
  hora: string;
  servico: string;
  cliente: string;
  status: string;
}

function mapAgendaItem(raw: Record<string, unknown>, index: number): AgendaItem {
  return {
    id: String(raw.id ?? index),
    data: String(raw.dataAgendamento ?? raw.DataAgendamento ?? ''),
    hora: String(raw.horaAgendamento ?? raw.HoraAgendamento ?? '00:00:00'),
    servico: String(raw.servicoNome ?? raw.ServicoNome ?? 'Serviço'),
    cliente: String(raw.usuarioNome ?? raw.UsuarioNome ?? 'Cliente'),
    status: String(raw.status ?? raw.Status ?? 'pendente').toLowerCase(),
  };
}

export default function AdminAgendaPage() {
  const { comercioId, isLoading: isLoadingComercio } = useComercioId();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [agendamentos, setAgendamentos] = useState<AgendaItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const hours = Array.from({ length: 11 }, (_, i) => i + 8);

  const fetchAgendamentos = React.useCallback(async () => {
    if (!comercioId) return;
    try {
      const data = await fetchApi(`/api/Agenda/Comercio/${comercioId}`, { skipToast: true } as RequestInit);
      const list = normalizeApiList<Record<string, unknown>>(data, ['Agenda Vazia']);
      setAgendamentos(list.map(mapAgendaItem));
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err);
      setAgendamentos([]);
    }
  }, [comercioId]);

  useEffect(() => {
    if (comercioId) fetchAgendamentos();
  }, [comercioId, fetchAgendamentos]);

  const handleOpenModal = (date?: string, time?: string) => {
    setSelectedDate(date || '');
    setSelectedTime(time || '');
    setIsModalOpen(true);
  };

  const dayAppointments = agendamentos.filter((a) => {
    const appointmentDate = new Date(a.data);
    return appointmentDate.toDateString() === currentDate.toDateString();
  });

  if (isLoadingComercio) return <PageLoader label="Carregando agenda..." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Agenda" description="Gerencie seus agendamentos diários.">
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </PageHeader>

      {IS_ADMIN_AGENDA_CLIENT_NAME_UNRELIABLE && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <p>
            Agendamentos criados pelo estabelecimento podem exibir o <strong>nome do profissional</strong> no lugar do
            cliente na listagem — bug conhecido na API (<code className="text-xs">Comercio-Agendar</code>). O horário é
            reservado corretamente; a correção do nome depende do backend.
          </p>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate((d) => new Date(d.setDate(d.getDate() - 1)))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-base font-semibold text-foreground capitalize min-w-[200px] text-center">
              {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate((d) => new Date(d.setDate(d.getDate() + 1)))}>
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
              const hourAppointments = dayAppointments.filter((a) => parseInt(a.hora.split(':')[0], 10) === hour);

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
                          className="rounded-xl bg-primary/5 border border-primary/15 p-3 transition-all hover:border-primary/30"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="text-sm font-semibold text-foreground">{agendamento.servico}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {agendamento.cliente} • {agendamento.hora.slice(0, 5)}
                              </p>
                            </div>
                            <StatusBadge label={agendamento.status} variant={getStatusVariant(agendamento.status)} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <button
                        type="button"
                        className="h-12 w-full rounded-xl border border-dashed border-border bg-muted/20 flex items-center justify-center opacity-60 hover:opacity-100 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                        onClick={() =>
                          handleOpenModal(
                            currentDate.toISOString().split('T')[0],
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Agendamento" size="lg">
        <AppointmentForm
          onSuccess={() => { setIsModalOpen(false); fetchAgendamentos(); }}
          onCancel={() => setIsModalOpen(false)}
          initialData={selectedDate}
          initialTime={selectedTime}
        />
      </Modal>
    </div>
  );
}
