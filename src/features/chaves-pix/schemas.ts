import { z } from 'zod';

/**
 * `TipoChave` é `string` livre na API (`ChavePixPost.tipoChave`, obrigatório, sem
 * validação no controller). Fixamos o vocabulário aqui para não gravar variações
 * ("cpf", "CPF", "Cpf") que depois quebram qualquer agrupamento por tipo.
 */
export const TIPO_CHAVE_PIX_VALUES = ['CPF', 'CNPJ', 'Email', 'Telefone', 'Aleatoria'] as const;
export type TipoChavePix = (typeof TIPO_CHAVE_PIX_VALUES)[number];

export const TipoChavePixEnum = z.enum(TIPO_CHAVE_PIX_VALUES);

export const TIPO_CHAVE_PIX_LABEL: Record<TipoChavePix, string> = {
  CPF: 'CPF',
  CNPJ: 'CNPJ',
  Email: 'E-mail',
  Telefone: 'Telefone',
  Aleatoria: 'Chave aleatória',
};

/**
 * `GET /api/ChavesPix` projeta só quatro campos (IdChavePix, Chave, TipoChave,
 * Status); `GET /api/ChavesPix/{id}` devolve a entidade inteira, com `criado`.
 * Um schema tolerante cobre os dois — e o PascalCase que o .NET às vezes emite.
 */
export const ChavePixSchema = z
  .object({
    idChavePix: z.number().optional(),
    IdChavePix: z.number().optional(),
    chave: z.string().optional().nullable(),
    Chave: z.string().optional().nullable(),
    tipoChave: z.string().optional().nullable(),
    TipoChave: z.string().optional().nullable(),
    status: z.boolean().optional().nullable(),
    Status: z.boolean().optional().nullable(),
    criado: z.string().optional().nullable(),
    Criado: z.string().optional().nullable(),
  })
  .transform((raw) => {
    const tipoChaveRaw = (raw.tipoChave ?? raw.TipoChave ?? '').trim();
    const tipoChaveParsed = TipoChavePixEnum.safeParse(tipoChaveRaw);

    return {
      idChavePix: raw.idChavePix ?? raw.IdChavePix ?? 0,
      chave: (raw.chave ?? raw.Chave ?? '').trim(),
      /** `null` quando a API devolveu um tipo fora do vocabulário conhecido. */
      tipoChave: tipoChaveParsed.success ? tipoChaveParsed.data : null,
      /** Preserva o valor cru para exibir chaves legadas sem perder informação. */
      tipoChaveRaw,
      /** `Status` é o "ativa?" — o DELETE só marca `false`, nunca apaga a linha. */
      ativa: (raw.status ?? raw.Status) ?? false,
      criado: (raw.criado ?? raw.Criado ?? '').trim(),
    };
  });

export type ChavePix = z.infer<typeof ChavePixSchema>;

export const ChavePixListSchema = z.array(ChavePixSchema);

/** Só dígitos — CPF/CNPJ/Telefone são digitados com máscara mas gravados limpos. */
function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

const CHAVE_VALIDATORS: Record<TipoChavePix, (chave: string) => string | null> = {
  CPF: (chave) => (onlyDigits(chave).length === 11 ? null : 'CPF deve ter 11 dígitos'),
  CNPJ: (chave) => (onlyDigits(chave).length === 14 ? null : 'CNPJ deve ter 14 dígitos'),
  Email: (chave) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(chave) ? null : 'Informe um e-mail válido',
  // DDD + número, com ou sem o 55 na frente (o PIX guarda em E.164).
  Telefone: (chave) => {
    const digits = onlyDigits(chave).replace(/^55/, '');
    return digits.length === 10 || digits.length === 11
      ? null
      : 'Informe DDD + número (ex.: 31988887777)';
  },
  Aleatoria: (chave) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chave)
      ? null
      : 'Chave aleatória tem o formato de um UUID',
};

const chaveField = z
  .string()
  .trim()
  .min(1, 'Informe a chave PIX')
  .max(140, 'Chave PIX longa demais');

/**
 * A API aceita qualquer string como chave (`ChavesPixController` só checa se veio
 * preenchida), então a validação por tipo vive aqui — chave malformada só falharia
 * lá na frente, na Bixs, sem mensagem útil para o usuário.
 */
const chavePixFormFields = {
  chave: chaveField,
  tipoChave: TipoChavePixEnum,
};

function refineChaveByTipo(
  data: { chave: string; tipoChave: TipoChavePix },
  ctx: z.RefinementCtx,
): void {
  const error = CHAVE_VALIDATORS[data.tipoChave](data.chave);
  if (error) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: error, path: ['chave'] });
  }
}

export const ChavePixFormSchema = z.object(chavePixFormFields).superRefine(refineChaveByTipo);

export type ChavePixFormInput = z.infer<typeof ChavePixFormSchema>;

/** Corpo de `PUT /api/ChavesPix/{id}` — `idChave` precisa bater com a rota. */
export const ChavePixUpdateInputSchema = z
  .object({
    ...chavePixFormFields,
    idChave: z.number().int().positive(),
    ativa: z.boolean(),
  })
  .superRefine(refineChaveByTipo);

export type ChavePixUpdateInput = z.infer<typeof ChavePixUpdateInputSchema>;

export type ChavesPixQueryResult =
  | { kind: 'forbidden' }
  | { kind: 'loaded'; data: ChavePix[] };
