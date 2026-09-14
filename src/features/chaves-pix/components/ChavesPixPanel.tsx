import { useRef, useState } from 'react';
import { AlertCircle, KeyRound, Loader2, Pencil, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/contexts/ToastContext';
import {
  getChavesPixErrorMessage,
  useChavesPix,
  useCreateChavePixMutation,
  useDeactivateChavePixMutation,
  useUpdateChavePixMutation,
} from '../hooks/useChavesPix';
import {
  TIPO_CHAVE_PIX_LABEL,
  type ChavePix,
  type ChavePixFormInput,
  type TipoChavePix,
} from '../schemas';
import { ChavePixReactivatedError } from '../services/chavesPixService';
import { ChavePixForm } from './ChavePixForm';

function describeTipo(chave: ChavePix): string {
  if (chave.tipoChave) return TIPO_CHAVE_PIX_LABEL[chave.tipoChave];
  return chave.tipoChaveRaw || 'Tipo não informado';
}

export function ChavesPixPanel() {
  const toast = useToast();
  const novaChaveButtonRef = useRef<HTMLButtonElement>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [chaveEmEdicao, setChaveEmEdicao] = useState<ChavePix | null>(null);
  const [chaveParaDesativar, setChaveParaDesativar] = useState<ChavePix | null>(null);

  const chavesQuery = useChavesPix();
  const createMutation = useCreateChavePixMutation();
  const updateMutation = useUpdateChavePixMutation();
  const deactivateMutation = useDeactivateChavePixMutation();

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    window.setTimeout(() => novaChaveButtonRef.current?.focus(), 0);
  };

  const handleCreate = async (values: ChavePixFormInput) => {
    try {
      await createMutation.mutateAsync(values);
      toast.success('Chave PIX cadastrada.');
      closeCreateModal();
    } catch (err) {
      // A API reporta a reativação como erro, mas ela já aconteceu no servidor.
      if (err instanceof ChavePixReactivatedError) {
        toast.warning(err.message);
        closeCreateModal();
        return;
      }
      toast.error(err instanceof Error ? err.message : 'Erro ao cadastrar chave PIX.');
    }
  };

  const handleUpdate = async (values: ChavePixFormInput) => {
    if (!chaveEmEdicao) return;
    try {
      await updateMutation.mutateAsync({
        ...values,
        idChave: chaveEmEdicao.idChavePix,
        ativa: chaveEmEdicao.ativa,
      });
      toast.success('Chave PIX atualizada.');
      setChaveEmEdicao(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar chave PIX.');
    }
  };

  const handleToggleAtiva = async (chave: ChavePix) => {
    try {
      if (chave.ativa) {
        await deactivateMutation.mutateAsync(chave.idChavePix);
        toast.success('Chave PIX desativada.');
        return;
      }
      // Não há endpoint de "reativar": o PUT com ativa=true faz o papel.
      await updateMutation.mutateAsync({
        idChave: chave.idChavePix,
        chave: chave.chave,
        tipoChave: (chave.tipoChave ?? 'CPF') as TipoChavePix,
        ativa: true,
      });
      toast.success('Chave PIX reativada.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar a chave PIX.');
    } finally {
      setChaveParaDesativar(null);
    }
  };

  const renderContent = () => {
    if (chavesQuery.isLoading) {
      return (
        <div className="flex justify-center py-16" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (chavesQuery.isError) {
      return (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
          <span>{getChavesPixErrorMessage(chavesQuery.error)}</span>
        </div>
      );
    }

    const result = chavesQuery.data;
    if (!result) return null;

    if (result.kind === 'forbidden') {
      return (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
          <span>
            Apenas o administrador do estabelecimento pode gerenciar as chaves PIX de
            recebimento.
          </span>
        </div>
      );
    }

    if (result.data.length === 0) {
      return (
        <EmptyState
          icon={KeyRound}
          title="Nenhuma chave PIX cadastrada"
          description="Cadastre a chave que o estabelecimento usa para receber os pagamentos."
          actionLabel="Cadastrar chave"
          onAction={() => setIsCreateModalOpen(true)}
        />
      );
    }

    return (
      <ul className="space-y-2">
        {result.data.map((chave) => (
          <li
            key={chave.idChavePix}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-foreground">{chave.chave}</p>
                <StatusBadge
                  label={chave.ativa ? 'Ativa' : 'Inativa'}
                  variant={chave.ativa ? 'success' : 'danger'}
                />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{describeTipo(chave)}</p>
            </div>

            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="ghost"
                className="min-h-11"
                onClick={() => setChaveEmEdicao(chave)}
                aria-label={`Editar chave ${chave.chave}`}
              >
                <Pencil className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="min-h-11"
                disabled={deactivateMutation.isPending || updateMutation.isPending}
                onClick={() =>
                  chave.ativa ? setChaveParaDesativar(chave) : void handleToggleAtiva(chave)
                }
                aria-label={`${chave.ativa ? 'Desativar' : 'Reativar'} chave ${chave.chave}`}
              >
                {chave.ativa ? (
                  <PowerOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Power className="h-4 w-4" aria-hidden />
                )}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  const podeCadastrar = chavesQuery.data?.kind === 'loaded';

  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-400">
              <KeyRound className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Chaves PIX</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Chaves usadas para receber os pagamentos dos agendamentos. Desativar não apaga
                a chave — ela pode ser reativada depois.
              </p>
            </div>
          </div>

          {podeCadastrar ? (
            <Button
              ref={novaChaveButtonRef}
              type="button"
              className="min-h-11"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Nova chave
            </Button>
          ) : null}
        </div>

        {renderContent()}
      </CardContent>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Cadastrar chave PIX"
        size="md"
      >
        <ChavePixForm
          submitLabel="Cadastrar"
          isSubmitting={createMutation.isPending}
          onSubmit={handleCreate}
          onCancel={closeCreateModal}
        />
      </Modal>

      <Modal
        isOpen={Boolean(chaveEmEdicao)}
        onClose={() => setChaveEmEdicao(null)}
        title="Editar chave PIX"
        size="md"
      >
        {chaveEmEdicao ? (
          <ChavePixForm
            submitLabel="Salvar"
            initialChave={chaveEmEdicao.chave}
            initialTipoChave={chaveEmEdicao.tipoChave ?? 'CPF'}
            isSubmitting={updateMutation.isPending}
            onSubmit={handleUpdate}
            onCancel={() => setChaveEmEdicao(null)}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(chaveParaDesativar)}
        onClose={() => setChaveParaDesativar(null)}
        onConfirm={() => {
          if (chaveParaDesativar) void handleToggleAtiva(chaveParaDesativar);
        }}
        title="Desativar chave PIX"
        description={
          chaveParaDesativar
            ? `A chave ${chaveParaDesativar.chave} deixa de receber pagamentos. Ela continua cadastrada e pode ser reativada.`
            : ''
        }
        confirmLabel="Desativar"
        variant="destructive"
        isLoading={deactivateMutation.isPending}
      />
    </Card>
  );
}
