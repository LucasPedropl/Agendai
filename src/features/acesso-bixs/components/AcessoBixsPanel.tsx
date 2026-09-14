import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  MessageSquare,
  PlugZap,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/contexts/ToastContext';
import {
  getAcessoBixsErrorMessage,
  getForbiddenMessage,
  useAcessoBixsStatus,
  useRequestAcessoBixsMutation,
  useSendVerificationCodeMutation,
} from '../hooks/useAcessoBixs';
import { VERIFICATION_CODE_TTL_SECONDS, type AcessoBixsStatus } from '../schemas';
import { SolicitarAcessoForm, type SolicitarAcessoFormValues } from './SolicitarAcessoForm';
import {
  ESTADO_ACESSO_LABEL,
  estadoBadgeVariant,
  formatSolicitadoDate,
} from '../utils/moduleLabels';
import { VerificationCodeEndpointMissingError } from '../services/acessoBixsService';

function ModuleStatusRow({
  icon: Icon,
  label,
  estado,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  estado: AcessoBixsStatus['payment'];
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">Módulo Bixs</p>
        </div>
      </div>
      <StatusBadge
        label={ESTADO_ACESSO_LABEL[estado]}
        variant={estadoBadgeVariant(estado)}
      />
    </div>
  );
}

export function AcessoBixsPanel() {
  const toast = useToast();
  const openFormButtonRef = useRef<HTMLButtonElement>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const statusQuery = useAcessoBixsStatus();
  const sendCodeMutation = useSendVerificationCodeMutation();
  const requestMutation = useRequestAcessoBixsMutation();

  const emailAdmin =
    statusQuery.data?.kind === 'loaded' ? statusQuery.data.data.emailAdmin : '';

  const handleSendVerificationCode = async () => {
    try {
      await sendCodeMutation.mutateAsync();
      const minutes = Math.round(VERIFICATION_CODE_TTL_SECONDS / 60);
      toast.success(
        emailAdmin
          ? `Enviamos um código de 6 dígitos para ${emailAdmin}. Válido por ${minutes} minutos.`
          : `Enviamos um código de 6 dígitos para o e-mail do administrador. Válido por ${minutes} minutos.`,
      );
    } catch (err) {
      if (err instanceof VerificationCodeEndpointMissingError) {
        toast.warning(err.message);
        throw err;
      }
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar código de verificação.');
      throw err;
    }
  };

  const handleRequestAccess = async (values: SolicitarAcessoFormValues) => {
    try {
      await requestMutation.mutateAsync(values);
      toast.success(
        values.isReactivation
          ? 'Solicitação reaberta. Aguarde aprovação do time Agendai.'
          : 'Solicitação enviada. Aguarde aprovação do time Agendai.',
      );
      setIsFormModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao solicitar acesso.');
      throw err;
    }
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    window.setTimeout(() => openFormButtonRef.current?.focus(), 0);
  };

  const renderStatusContent = () => {
    if (statusQuery.isLoading) {
      return (
        <div className="flex justify-center py-16" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (statusQuery.isError) {
      return (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
          <span>{getAcessoBixsErrorMessage(statusQuery.error)}</span>
        </div>
      );
    }

    const result = statusQuery.data;
    if (!result) return null;

    if (result.kind === 'forbidden') {
      return (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
          <span>{getForbiddenMessage()}</span>
        </div>
      );
    }

    if (result.kind === 'no_admin_commerce') {
      return (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
          <span>
            Nenhum estabelecimento vinculado como administrador nesta conta. Verifique seu cadastro
            ou entre em contato com o suporte.
          </span>
        </div>
      );
    }

    if (result.kind === 'never_requested') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Os módulos Bixs permitem receber pagamentos online e enviar lembretes automáticos via
            WhatsApp. A liberação é feita pelo time Agendai após sua solicitação.
          </p>
          <button
            ref={openFormButtonRef}
            type="button"
            className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            onClick={() => setIsFormModalOpen(true)}
          >
            Solicitar integração
          </button>
        </div>
      );
    }

    const status: AcessoBixsStatus = result.data;

    if (status.estado === 'Solicitado') {
      return (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
            <Clock3 className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Aguardando aprovação</p>
              <p className="text-sm text-muted-foreground">
                Sua solicitação foi registrada e está em análise pelo time Agendai.
              </p>
              <p className="text-xs text-muted-foreground">
                Solicitado em {formatSolicitadoDate(status.solicitado)}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <ModuleStatusRow icon={CreditCard} label="Pagamentos" estado={status.payment} />
            <ModuleStatusRow icon={MessageSquare} label="WhatsApp" estado={status.whatsapp} />
          </div>
        </div>
      );
    }

    if (status.estado === 'Ativo') {
      return (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
            <CheckCircle2
              className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-hidden
            />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Integração liberada</p>
              <p className="text-sm text-muted-foreground">
                Empresa: {status.nomeEmpresa || '—'}
              </p>
              {status.solicitado ? (
                <p className="text-xs text-muted-foreground">
                  Solicitado em {formatSolicitadoDate(status.solicitado)}
                </p>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <ModuleStatusRow icon={CreditCard} label="Pagamentos" estado={status.payment} />
            <ModuleStatusRow icon={MessageSquare} label="WhatsApp" estado={status.whatsapp} />
          </div>
        </div>
      );
    }

    if (status.estado === 'Inativo') {
      return (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
            <AlertCircle
              className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden
            />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Acesso desativado</p>
              <p className="text-sm text-muted-foreground">
                Sua integração Bixs foi desativada. Você pode solicitar novamente abaixo.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <ModuleStatusRow icon={CreditCard} label="Pagamentos" estado={status.payment} />
            <ModuleStatusRow icon={MessageSquare} label="WhatsApp" estado={status.whatsapp} />
          </div>
          <SolicitarAcessoForm
            submitLabel="Solicitar novamente"
            isReactivation
            initialPayment={status.payment !== 'Inativo'}
            initialWhatsapp={status.whatsapp !== 'Inativo'}
            isSubmitting={requestMutation.isPending}
            isSendingCode={sendCodeMutation.isPending}
            onSubmit={handleRequestAccess}
            onSendVerificationCode={handleSendVerificationCode}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrações Bixs"
        description="Solicite e acompanhe o acesso aos módulos de Pagamentos e WhatsApp."
      />

      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-xl bg-sky-500/10 p-2 text-sky-700 dark:text-sky-400">
              <PlugZap className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Status da integração</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pagamentos e WhatsApp são liberados separadamente após aprovação do time Agendai.
              </p>
            </div>
          </div>

          {renderStatusContent()}
        </CardContent>
      </Card>

      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title="Solicitar integração Bixs"
        size="lg"
      >
        <p className="mb-4 text-sm text-muted-foreground">
          Selecione os módulos desejados, confirme sua senha e informe o código de verificação de
          6 dígitos.
        </p>
        <SolicitarAcessoForm
          submitLabel="Enviar solicitação"
          isSubmitting={requestMutation.isPending}
          isSendingCode={sendCodeMutation.isPending}
          onSubmit={handleRequestAccess}
          onSendVerificationCode={handleSendVerificationCode}
        />
      </Modal>
    </div>
  );
}
