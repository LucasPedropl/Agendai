'use client';

import React, { useState } from 'react';
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
import { Search, Mail, Phone, Calendar, Plus, Users, UserX } from 'lucide-react';
import { Cliente } from '@/types';
import { fetchApi } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/contexts/ToastContext';
import { useComercioId } from '@/hooks/useComercioId';
import { useComercioUsuarios, useDesativarComercioUsuario } from '@/hooks/useAdminQueries';
import { getFriendlyErrorMessage } from '@/lib/errors';

export default function AdminClientesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { comercioId, isLoading: isLoadingComercio } = useComercioId();
  const { data: clientes = [], isPending: isLoading } = useComercioUsuarios<Cliente>(comercioId, 'Clientes');
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

  const clientesList = clientes;

  const filtered = clientesList.filter((c) => {
    const term = search.toLowerCase();
    return c.nome?.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term);
  });

  if (isLoadingComercio || isLoading) return <PageLoader label="Carregando clientes..." />;

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
        isOpen={!!confirmId}
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
                            {cliente.nome.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{cliente.nome}</div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              {cliente.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{cliente.email}</span>}
                              {cliente.telefone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{cliente.telefone}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <StatusBadge label={cliente.status || 'Pendente'} variant={getStatusVariant(cliente.status || 'pendente')} />
                      </td>
                      <td className="text-center font-medium text-foreground">{cliente.totalAgendamentos ?? 0}</td>
                      <td>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {cliente.ultimoAgendamento ? new Date(cliente.ultimoAgendamento).toLocaleDateString('pt-BR') : '—'}
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
