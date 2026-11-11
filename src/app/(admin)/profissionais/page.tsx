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
import { Plus, Trash2, Phone, Users, RotateCcw } from 'lucide-react';
import { Profissional } from '@/types';
import { fetchApi } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useComercioId } from '@/hooks/useComercioId';
import {
  extractApiMessage,
  useComercioUsuarios,
  useDesativarComercioUsuario,
  useReativarComercioUsuario,
} from '@/hooks/useAdminQueries';
import { getFriendlyErrorMessage } from '@/lib/errors';

const isInativo = (status?: string) => status?.toLowerCase() === 'inativo';

export default function AdminProfissionaisPage() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { showToast } = useToast();
  const { comercioId, isLoading: isLoadingComercio } = useComercioId();
  const { data: profissionais = [], isPending: isLoading } = useComercioUsuarios<Profissional>(comercioId, 'Profissionais');
  const desativarMutation = useDesativarComercioUsuario('Profissionais', comercioId);
  const reativarMutation = useReativarComercioUsuario('Profissionais', comercioId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const refreshProfissionais = () => {
    if (comercioId) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.comercioUsuarios('Profissionais', comercioId) });
    }
  };

  const handleDesativar = async () => {
    if (!confirmId) return;
    setIsDeactivating(true);
    try {
      const message = await desativarMutation.mutateAsync(confirmId);
      showToast(message ?? 'Profissional desativado.', 'success');
      setConfirmId(null);
    } catch (err: unknown) {
      showToast(getFriendlyErrorMessage(err, 'Não foi possível desativar o profissional.'), 'error');
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleReativar = async (id: string) => {
    try {
      const message = await reativarMutation.mutateAsync(id);
      showToast(message ?? 'Profissional reativado.', 'success');
    } catch (err: unknown) {
      showToast(getFriendlyErrorMessage(err, 'Não foi possível reativar o profissional.'), 'error');
    }
  };

  const handleInviteProfissional = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!comercioId) return;
      const response: unknown = await fetchApi('/api/ComercioUsuarios/Cadastrar-Funcionario-Cliente', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ idComercio: comercioId, nome, email, permissao: 1 }),
        skipToast: true,
      });
      setIsModalOpen(false);
      setNome('');
      setEmail('');
      showToast(extractApiMessage(response) ?? 'Convite enviado com sucesso!', 'success');
      refreshProfissionais();
    } catch (err: unknown) {
      showToast(getFriendlyErrorMessage(err, 'Não foi possível enviar o convite ao profissional.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const profissionaisList = profissionais;

  if (isLoadingComercio || isLoading) return <PageLoader label="Carregando profissionais..." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Profissionais" description="Gerencie sua equipe e especialidades.">
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Convidar Profissional
        </Button>
      </PageHeader>

      <ConfirmDialog
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDesativar}
        title="Desativar profissional"
        description="O profissional perderá acesso ao estabelecimento. Você pode convidá-lo novamente depois."
        confirmLabel="Desativar"
        variant="destructive"
        isLoading={isDeactivating}
      />

      {profissionaisList.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum profissional cadastrado"
          description="Convide profissionais para gerenciar a agenda do estabelecimento."
          actionLabel="Adicionar Profissional"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {profissionaisList.map((profissional) => (
            <Card key={profissional.id} className="overflow-hidden hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {profissional.nome.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{profissional.nome}</CardTitle>
                    {profissional.status && (
                      <StatusBadge
                        label={profissional.status}
                        variant={isInativo(profissional.status) ? 'danger' : getStatusVariant(profissional.status)}
                        className="mt-1"
                      />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {profissional.telefone || 'Sem telefone'}
                </div>
                {isInativo(profissional.status) ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    disabled={reativarMutation.isPending}
                    onClick={() => void handleReativar(String(profissional.id))}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reativar
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                    onClick={() => setConfirmId(String(profissional.id))}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Desativar
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Convidar Profissional">
        <form onSubmit={handleInviteProfissional} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enviaremos um convite por e-mail para que o profissional realize seu cadastro.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="nome">Nome Completo</label>
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
    </div>
  );
}
