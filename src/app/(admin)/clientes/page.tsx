'use client';

import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoader } from '@/components/ui/page-loader';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Search, Mail, Phone, Calendar, Plus, Users, UserX, Loader2 } from 'lucide-react';
import { Cliente } from '@/types';
import { fetchApi } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/contexts/ToastContext';
import { useComercioId } from '@/hooks/useComercioId';
import {
  useComercioUsuarios,
  useDesativarComercioUsuario,
  useAgendaComercio,
  useHistoricoComercio,
} from '@/hooks/useAdminQueries';
import { getFriendlyErrorMessage } from '@/lib/errors';

/** Normaliza string para comparação sem case e sem espaços sobressalentes */
function normalizeStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim().toLowerCase();
}

/** Verifica se data é válida e não é DateTime.MinValue (ano 0001) */
function isValidDate(dateVal: unknown): boolean {
  if (!dateVal) return false;
  const d = new Date(String(dateVal));
  if (isNaN(d.getTime())) return false;
  return d.getFullYear() > 1900;
}

/** Extrai timestamp para ordenação segura */
function getAppointmentTimestamp(appointment: Record<string, unknown>): number {
  const dateStr = String(
    appointment.dataAgendamento ??
      appointment.DataAgendamento ??
      appointment.data ??
      appointment.Data ??
      ''
  );
  const timeStr = String(
    appointment.horaAgendamento ??
      appointment.HoraAgendamento ??
      appointment.hora ??
      appointment.Hora ??
      '00:00:00'
  );

  if (!dateStr) return 0;
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const d = new Date(`${cleanDate}T${timeStr.slice(0, 8)}`);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

/** Compara se o agendamento pertence ao cliente especificado */
function matchesClient(
  appointment: Record<string, unknown>,
  client: Cliente & Record<string, unknown>
): boolean {
  // 1. Casamento por ID direto
  const appClientId = normalizeStr(
    appointment.usuarioId ??
      appointment.UsuarioId ??
      appointment.idUsuario ??
      appointment.IdUsuario ??
      appointment.clienteId ??
      appointment.ClienteId
  );
  const clientId = normalizeStr(client.id ?? client.Id);

  if (appClientId && clientId && appClientId === clientId) {
    return true;
  }

  // 2. Casamento por Nome ou Email
  const appClientName = normalizeStr(
    appointment.usuarioNome ??
      appointment.UsuarioNome ??
      appointment.clienteNome ??
      appointment.ClienteNome ??
      appointment.cliente ??
      appointment.Cliente
  );

  const clientName = normalizeStr(client.nome ?? client.Nome);
  const clientEmail = normalizeStr(client.email ?? client.Email);

  if (appClientName) {
    if (clientName && appClientName === clientName) return true;
    if (clientEmail && appClientName === clientEmail) return true;
  }

  return false;
}

export default function AdminClientesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { comercioId, isLoading: isLoadingComercio } = useComercioId();

  // Clientes do comércio
  const {
    data: clientesRaw = [],
    isPending: isLoadingClientes,
    isError: isClientesError,
  } = useComercioUsuarios<Cliente & Record<string, unknown>>(comercioId, 'Clientes');

  // Agenda ativa (hoje e futuro)
  const {
    data: agendaList = [],
    isPending: isLoadingAgenda,
    isError: isAgendaError,
  } = useAgendaComercio(comercioId);

  // Histórico de agendamentos passados
  const {
    data: historicoList = [],
    isPending: isLoadingHistorico,
    isError: isHistoricoError,
  } = useHistoricoComercio(comercioId, '');

  const desativarMutation = useDesativarComercioUsuario('Clientes', comercioId);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');

  const refreshClientes = () => {
    if (comercioId) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.comercioUsuarios('Clientes', comercioId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.agendaComercio(comercioId) });
    }
  };

  const handleDesativar = async () => {
    if (!confirmId) return;
    setIsDeactivating(true);
    try {
      await desativarMutation.mutateAsync(confirmId);
      showToast('Cliente desativado.', 'success');
      setConfirmId(null);
    } catch (err: unknown) {
      showToast(getFriendlyErrorMessage(err, 'Não foi possível desativar o cliente.'), 'error');
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleInviteCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!comercioId) return;
      await fetchApi('/api/ComercioUsuarios/Cadastrar-Funcionario-Cliente', {
        method: 'POST',
        body: { idComercio: comercioId, nome, email, permissao: 0 },
        skipToast: true,
      });
      setIsModalOpen(false);
      setNome('');
      setEmail('');
      showToast('Convite enviado com sucesso!', 'success');
      refreshClientes();
    } catch (err: unknown) {
      showToast(getFriendlyErrorMessage(err, 'Não foi possível enviar o convite ao cliente.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Consolidação de todos os agendamentos conhecidos (agenda ativa + histórico)
  const allAppointments = useMemo(() => {
    // A API põe o agendamento de hoje tanto na agenda quanto no histórico
    // (compara data sem hora com "agora"): deduplicar por id para não contar duas vezes.
    const byId = new Map<string, Record<string, unknown>>();
    const withoutId: Record<string, unknown>[] = [];
    const sources = [
      ...(Array.isArray(agendaList) ? agendaList : []),
      ...(Array.isArray(historicoList) ? historicoList : []),
    ] as Record<string, unknown>[];
    for (const item of sources) {
      const id = item.id ?? item.Id;
      if (id === undefined || id === null) withoutId.push(item);
      else if (!byId.has(String(id))) byId.set(String(id), item);
    }
    return [...byId.values(), ...withoutId];
  }, [agendaList, historicoList]);

  // Se a role não tem permissão para acessar agenda nem histórico (ex: 403), não podemos calcular com precisão
  const isAppointmentDataUnavailable = isAgendaError && isHistoricoError;
  const isAppointmentsLoading = isLoadingAgenda || isLoadingHistorico;

  // Lista enriquecida de clientes com contagem e data calculadas client-side
  const clientes = useMemo(() => {
    return clientesRaw.map((cliente) => {
      // Filtrar todos os agendamentos que pertencem a este cliente
      const matched = allAppointments.filter((a) => matchesClient(a, cliente));

      // Ordenar do mais recente para o mais antigo
      matched.sort((a, b) => getAppointmentTimestamp(b) - getAppointmentTimestamp(a));

      const rawUltimaVisita = cliente.ultimaVisita ?? cliente.UltimaVisita ?? cliente.ultimoAgendamento;
      const hasValidBackendUltimaVisita = isValidDate(rawUltimaVisita);

      // Calcular total de agendamentos
      let total: number | null = null;
      if (!isAppointmentDataUnavailable) {
        total = matched.length;
        // Se a busca client-side não encontrou registros nos endpoints de agenda/histórico,
        // mas o backend retornou uma UltimaVisita válida, sabemos que existe pelo menos 1
        if (total === 0 && hasValidBackendUltimaVisita) {
          total = 1;
        }
      }

      // Calcular data do último (ou próximo) agendamento
      let ultimoAgendamentoFormatted: string | null = null;

      if (matched.length > 0) {
        const mostRecent = matched[0];
        const dateRaw = String(
          mostRecent.dataAgendamento ??
            mostRecent.DataAgendamento ??
            mostRecent.data ??
            mostRecent.Data ??
            ''
        );
        if (isValidDate(dateRaw)) {
          const d = new Date(dateRaw);
          ultimoAgendamentoFormatted = d.toLocaleDateString('pt-BR');
        }
      } else if (hasValidBackendUltimaVisita) {
        const d = new Date(String(rawUltimaVisita));
        ultimoAgendamentoFormatted = d.toLocaleDateString('pt-BR');
      }

      return {
        ...cliente,
        id: String(cliente.id ?? cliente.Id ?? ''),
        nome: String(cliente.nome ?? cliente.Nome ?? 'Cliente'),
        email: cliente.email ? String(cliente.email) : undefined,
        telefone: cliente.telefone ? String(cliente.telefone) : undefined,
        status: String(cliente.status ?? cliente.Status ?? 'Ativo'),
        computedTotal: total,
        computedUltimoAgendamento: ultimoAgendamentoFormatted,
      };
    });
  }, [clientesRaw, allAppointments, isAppointmentDataUnavailable]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return clientes.filter((c) => {
      return (
        c.nome.toLowerCase().includes(term) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.telefone && c.telefone.includes(term))
      );
    });
  }, [clientes, search]);

  if (isLoadingComercio || isLoadingClientes) {
    return <PageLoader label="Carregando clientes..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" description="Gerencie sua base de clientes e histórico.">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar cliente..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Convidar Cliente
        </Button>
      </PageHeader>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Convidar Novo Cliente">
        <form onSubmit={handleInviteCliente} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enviaremos um convite por e-mail para que o cliente realize o cadastro completo.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="nome">Nome do Cliente</label>
            <Input id="nome" required placeholder="Ex: João da Silva" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">E-mail</label>
            <Input id="email" type="email" required placeholder="exemplo@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(confirmId)}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDesativar}
        title="Desativar cliente"
        description="O cliente perderá acesso ao estabelecimento. Esta ação pode ser revertida convidando-o novamente."
        confirmLabel="Desativar"
        variant="destructive"
        isLoading={isDeactivating}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente encontrado"
          description={search ? 'Tente outro termo de busca.' : 'Convide seu primeiro cliente para começar.'}
          actionLabel={search ? undefined : 'Convidar Cliente'}
          onAction={search ? undefined : () => setIsModalOpen(true)}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">{filtered.length} cliente(s)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome / Contato</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Agendamentos</th>
                    <th>Último Agendamento</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((cliente) => (
                    <tr key={cliente.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {cliente.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{cliente.nome}</div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              {cliente.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {cliente.email}
                                </span>
                              )}
                              {cliente.telefone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {cliente.telefone}
                                </span>
                              )}
                              {!cliente.email && !cliente.telefone && (
                                <span className="text-muted-foreground/60">—</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <StatusBadge
                          label={cliente.status || 'Pendente'}
                          variant={getStatusVariant(cliente.status || 'pendente')}
                        />
                      </td>
                      <td className="text-center font-medium text-foreground">
                        {isAppointmentsLoading ? (
                          <span className="inline-flex items-center text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            calculando...
                          </span>
                        ) : isAppointmentDataUnavailable ? (
                          <span title="Dados de agendamento não disponíveis para este perfil" className="text-muted-foreground">
                            —
                          </span>
                        ) : cliente.computedTotal !== null ? (
                          cliente.computedTotal
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {isAppointmentsLoading ? (
                            <span className="text-xs text-muted-foreground">...</span>
                          ) : cliente.computedUltimoAgendamento ? (
                            <span className="text-foreground">{cliente.computedUltimoAgendamento}</span>
                          ) : (
                            <span>—</span>
                          )}
                        </div>
                      </td>
                      <td className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setConfirmId(String(cliente.id))}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Desativar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
