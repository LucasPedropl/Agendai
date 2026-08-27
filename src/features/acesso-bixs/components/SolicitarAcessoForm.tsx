import React, { useEffect, useId, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AcessoBixsRequestInputSchema } from '../schemas';
import { VerificationCodeEndpointMissingError } from '../services/acessoBixsService';

const RESEND_COOLDOWN_SECONDS = 60;

export interface SolicitarAcessoFormValues {
  requestPayment: boolean;
  requestWhatsapp: boolean;
  password: string;
  verificationCode: string;
}

interface SolicitarAcessoFormProps {
  submitLabel: string;
  initialPayment?: boolean;
  initialWhatsapp?: boolean;
  isSubmitting: boolean;
  isSendingCode: boolean;
  onSubmit: (values: SolicitarAcessoFormValues) => Promise<void>;
  onSendVerificationCode: () => Promise<void>;
}

export function SolicitarAcessoForm({
  submitLabel,
  initialPayment = true,
  initialWhatsapp = false,
  isSubmitting,
  isSendingCode,
  onSubmit,
  onSendVerificationCode,
}: SolicitarAcessoFormProps) {
  const formId = useId();
  const [requestPayment, setRequestPayment] = useState(initialPayment);
  const [requestWhatsapp, setRequestWhatsapp] = useState(initialWhatsapp);
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [codeNotice, setCodeNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const paymentCheckboxId = `${formId}-payment`;
  const whatsappCheckboxId = `${formId}-whatsapp`;
  const passwordId = `${formId}-password`;
  const verificationCodeId = `${formId}-verification-code`;
  const modulesErrorId = `${formId}-modules-error`;
  const passwordErrorId = `${formId}-password-error`;
  const codeErrorId = `${formId}-code-error`;

  const isCoolingDown = resendCooldown > 0;

  useEffect(() => {
    if (!isCoolingDown) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isCoolingDown]);

  const handleSendCode = async () => {
    try {
      await onSendVerificationCode();
      setCodeNotice(null);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      if (err instanceof VerificationCodeEndpointMissingError) {
        setCodeNotice(err.message);
        return;
      }
      setCodeNotice(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});

    const parsed = AcessoBixsRequestInputSchema.safeParse({
      requestPayment,
      requestWhatsapp,
      password,
      verificationCode,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    await onSubmit({
      requestPayment,
      requestWhatsapp,
      password,
      verificationCode,
    });
    setPassword('');
    setVerificationCode('');
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 max-w-lg">
      <div className="space-y-3">
        <label
          htmlFor={paymentCheckboxId}
          className="flex min-h-11 items-center gap-3 text-sm text-foreground cursor-pointer"
        >
          <input
            id={paymentCheckboxId}
            type="checkbox"
            checked={requestPayment}
            onChange={(event) => setRequestPayment(event.target.checked)}
            className="h-4 w-4 rounded border-border"
            aria-invalid={Boolean(fieldErrors.requestPayment)}
            aria-describedby={fieldErrors.requestPayment ? modulesErrorId : undefined}
          />
          Solicitar módulo de Pagamentos (Bixs)
        </label>
        <label
          htmlFor={whatsappCheckboxId}
          className="flex min-h-11 items-center gap-3 text-sm text-foreground cursor-pointer"
        >
          <input
            id={whatsappCheckboxId}
            type="checkbox"
            checked={requestWhatsapp}
            onChange={(event) => setRequestWhatsapp(event.target.checked)}
            className="h-4 w-4 rounded border-border"
            aria-invalid={Boolean(fieldErrors.requestPayment)}
            aria-describedby={fieldErrors.requestPayment ? modulesErrorId : undefined}
          />
          Solicitar módulo de WhatsApp (Bixs)
        </label>
        {fieldErrors.requestPayment ? (
          <p id={modulesErrorId} className="text-sm text-destructive" role="alert">
            {fieldErrors.requestPayment}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={passwordId} className="text-sm font-medium text-foreground">
          Senha da conta (confirmação)
        </label>
        <Input
          id={passwordId}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Sua senha de administrador"
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
        />
        {fieldErrors.password ? (
          <p id={passwordErrorId} className="text-sm text-destructive" role="alert">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor={verificationCodeId} className="text-sm font-medium text-foreground">
          Código de verificação (6 dígitos)
        </label>
        <Input
          id={verificationCodeId}
          value={verificationCode}
          onChange={(event) =>
            setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))
          }
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          aria-invalid={Boolean(fieldErrors.verificationCode)}
          aria-describedby={
            fieldErrors.verificationCode || codeNotice ? codeErrorId : undefined
          }
        />
        {fieldErrors.verificationCode ? (
          <p id={codeErrorId} className="text-sm text-destructive" role="alert">
            {fieldErrors.verificationCode}
          </p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto min-h-11"
          disabled={isSendingCode || isCoolingDown}
          onClick={() => void handleSendCode()}
        >
          {isSendingCode ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : isCoolingDown ? (
            `Reenviar em ${resendCooldown}s`
          ) : (
            'Enviar código'
          )}
        </Button>
        {codeNotice ? (
          <div
            id={codeErrorId}
            className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
            <span>{codeNotice}</span>
          </div>
        ) : null}
      </div>

      <Button type="submit" className="min-h-11" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
