import { z } from 'zod';

/** Ordem do enum C# `Estado`: Ativo = 0, Inativo = 1, Solicitado = 2. */
export const ESTADO_ACESSO_VALUES = ['Ativo', 'Inativo', 'Solicitado'] as const;
export type EstadoAcesso = (typeof ESTADO_ACESSO_VALUES)[number];

export const EstadoAcessoEnum = z.enum(ESTADO_ACESSO_VALUES);

export const ESTADO_ACESSO_TO_API: Record<EstadoAcesso, number> = {
  Ativo: 0,
  Inativo: 1,
  Solicitado: 2,
};

export const coerceEstadoAcesso = z.preprocess((value) => {
  if (typeof value === 'number') {
    return ESTADO_ACESSO_VALUES[value] ?? value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return ESTADO_ACESSO_VALUES[Number(value)] ?? value;
  }
  return value;
}, EstadoAcessoEnum);

export const AcessoBixsStatusSchema = z
  .object({
    idControle: z.number().optional(),
    IdControle: z.number().optional(),
    nomeEmpresa: z.string().optional().nullable(),
    NomeEmpresa: z.string().optional().nullable(),
    cpf_CNPJ: z.string().optional().nullable(),
    cpF_CNPJ: z.string().optional().nullable(),
    CPF_CNPJ: z.string().optional().nullable(),
    estado: coerceEstadoAcesso.optional(),
    Estado: coerceEstadoAcesso.optional(),
    payment: coerceEstadoAcesso.optional(),
    Payment: coerceEstadoAcesso.optional(),
    whatsapp: coerceEstadoAcesso.optional(),
    Whatsapp: coerceEstadoAcesso.optional(),
    solicitado: z.union([z.string(), z.coerce.date()]).optional().nullable(),
    Solicitado: z.union([z.string(), z.coerce.date()]).optional().nullable(),
    emailAdmin: z.string().optional().nullable(),
    EmailAdmin: z.string().optional().nullable(),
    nomeAdmin: z.string().optional().nullable(),
    NomeAdmin: z.string().optional().nullable(),
    cpfAdmin: z.string().optional().nullable(),
    CPFAdmin: z.string().optional().nullable(),
    dataSolicitado: z.string().optional().nullable(),
    DataSolicitado: z.string().optional().nullable(),
  })
  .transform((raw) => {
    const solicitadoRaw = raw.solicitado ?? raw.Solicitado;
    let solicitadoIso = '';
    if (solicitadoRaw instanceof Date && !Number.isNaN(solicitadoRaw.getTime())) {
      solicitadoIso = solicitadoRaw.toISOString();
    } else if (typeof solicitadoRaw === 'string' && solicitadoRaw.trim()) {
      solicitadoIso = solicitadoRaw.trim();
    }

    return {
      idControle: raw.idControle ?? raw.IdControle ?? 0,
      nomeEmpresa: raw.nomeEmpresa ?? raw.NomeEmpresa ?? '',
      cpfCnpj: raw.cpf_CNPJ ?? raw.cpF_CNPJ ?? raw.CPF_CNPJ ?? '',
      estado: raw.estado ?? raw.Estado ?? 'Solicitado',
      payment: raw.payment ?? raw.Payment ?? 'Inativo',
      whatsapp: raw.whatsapp ?? raw.Whatsapp ?? 'Inativo',
      solicitado: solicitadoIso,
      emailAdmin: raw.emailAdmin ?? raw.EmailAdmin ?? '',
      nomeAdmin: raw.nomeAdmin ?? raw.NomeAdmin ?? '',
      cpfAdmin: raw.cpfAdmin ?? raw.CPFAdmin ?? '',
    };
  });

export type AcessoBixsStatus = z.infer<typeof AcessoBixsStatusSchema>;

export const AcessoBixsRequestInputSchema = z
  .object({
    requestPayment: z.boolean(),
    requestWhatsapp: z.boolean(),
    password: z.string().min(1, 'Informe sua senha para confirmar'),
    verificationCode: z
      .string()
      .trim()
      .regex(/^\d{6}$/, 'Informe o código de 6 dígitos'),
  })
  .refine((data) => data.requestPayment || data.requestWhatsapp, {
    message: 'Marque ao menos Pagamentos ou WhatsApp.',
    path: ['requestPayment'],
  });

export type AcessoBixsRequestInput = z.infer<typeof AcessoBixsRequestInputSchema>;

export const SendVerificationCodeResultSchema = z
  .object({
    sent_to: z.string().optional().nullable(),
    sentTo: z.string().optional().nullable(),
    expires_in_seconds: z.number().optional(),
    expiresInSeconds: z.number().optional(),
  })
  .transform((raw) => ({
    sentTo: raw.sent_to ?? raw.sentTo ?? '',
    expiresInSeconds: raw.expires_in_seconds ?? raw.expiresInSeconds ?? 900,
  }));

export type SendVerificationCodeResult = z.infer<typeof SendVerificationCodeResultSchema>;

export type AcessoBixsStatusQueryResult =
  | { kind: 'never_requested' }
  | { kind: 'no_admin_commerce' }
  | { kind: 'forbidden' }
  | { kind: 'loaded'; data: AcessoBixsStatus };
