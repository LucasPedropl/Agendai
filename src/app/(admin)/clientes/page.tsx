'use client';

import React, { useState, useEffect } from 'react';
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
import { fetchComercioUsuariosList } from '@/lib/apiHelpers';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useComercioId } from '@/hooks/useComercioId';

export default function AdminClientesPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const { comercioId } = useComercioId();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');

  const fetchClientes = async (silent = false) => {
    if (!comercioId) return;
    if (!silent) setIsLoading(true);
    try {
      const list = await fetchComercioUsuariosList<Cliente>(
        fetchApi,
        'Clientes',
        comercioId
      );
      setClientes(list);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
      setClientes([]);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && comercioId) fetchClientes();
  }, [token, comercioId]);

  const handleDesativar = async () => {
    if (!comercioId || !confirmId) return;
    setIsDeactivating(true);
    try {
      await fetchApi(`/Desativar-Usuario/${comercioId}/${confirmId}`, {
        method: 'DELETE',
        skipToast: true,
      } as RequestInit);
      showToast('Cliente desativado.', 'success');
      setConfirmId(null);
      fetchClientes(true);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao desativar.', 'error');
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
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ idComercio: comercioId, nome, email, permissao: 0 }),
        skipToast: true,
      } as RequestInit);
      setIsModalOpen(false);
      setNome('');
      setEmail('');
      showToast('Convite enviado com sucesso!', 'success');
      setTimeout(() => fetchClientes(true), 500);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao convidar cliente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = clientes.filter((c) => {
    const term = search.toLowerCase();
    return c.nome?.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term);
  });

  if (isLoading) return <PageLoader label="Carregando clientes..." />;

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
