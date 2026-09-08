import { z } from 'zod';
import { BRAZIL_UF_VALUES } from './brazilianStates';
import { digitsOnly } from './formatters';

export const WIZARD_STEPS = [
  { id: 'identity', label: 'Estabelecimento' },
  { id: 'address', label: 'Endereço' },
  { id: 'contact', label: 'Contato' },
  { id: 'settings', label: 'Configurações' },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id'];

export const CadastroComercioFormSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome do comércio'),
  cnpj: z
    .string()
    .refine((value) => digitsOnly(value).length === 14, 'CNPJ deve ter 14 dígitos'),
  descricao: z.string().trim().min(8, 'Conte um pouco sobre o negócio'),
  cep: z
    .string()
    .refine((value) => digitsOnly(value).length === 8, 'CEP deve ter 8 dígitos'),
  rua: z.string().trim().min(2, 'Informe a rua'),
  numero: z.string().trim().min(1, 'Informe o número'),
  complemento: z.string(),
  bairro: z.string().trim().min(2, 'Informe o bairro'),
  cidade: z.string().trim().min(2, 'Informe a cidade'),
  estado: z
    .string()
    .transform((value) => value.toUpperCase())
    .refine(
      (value): value is (typeof BRAZIL_UF_VALUES)[number] =>
        (BRAZIL_UF_VALUES as readonly string[]).includes(value),
      'Selecione a UF',
    ),
  referencia: z.string(),
  telefone: z
    .string()
    .refine((value) => {
      const length = digitsOnly(value).length;
      return length === 10 || length === 11;
    }, 'Telefone inválido'),
  email: z.string().trim().email('E-mail inválido'),
  instagram: z.string(),
  facebook: z.string(),
  site: z.string(),
  notificarAgendamento: z.boolean(),
  lembrarAgendamento: z.boolean(),
  resumoDiario: z.boolean(),
});

export type CadastroComercioFormValues = z.input<typeof CadastroComercioFormSchema>;

export const IdentityStepSchema = CadastroComercioFormSchema.pick({
  nome: true,
  cnpj: true,
  descricao: true,
});

export const AddressStepSchema = CadastroComercioFormSchema.pick({
  cep: true,
  rua: true,
  numero: true,
  complemento: true,
  bairro: true,
  cidade: true,
  estado: true,
  referencia: true,
});

export const ContactStepSchema = CadastroComercioFormSchema.pick({
  telefone: true,
  email: true,
  instagram: true,
  facebook: true,
  site: true,
});

export const SettingsStepSchema = CadastroComercioFormSchema.pick({
  notificarAgendamento: true,
  lembrarAgendamento: true,
  resumoDiario: true,
});

const STEP_SCHEMAS = [
  IdentityStepSchema,
  AddressStepSchema,
  ContactStepSchema,
  SettingsStepSchema,
] as const;

export function emptyCadastroComercioForm(): CadastroComercioFormValues {
  return {
    nome: '',
    cnpj: '',
    descricao: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    referencia: '',
    telefone: '',
    email: '',
    instagram: '',
    facebook: '',
    site: '',
    notificarAgendamento: true,
    lembrarAgendamento: true,
    resumoDiario: true,
  };
}

export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !map[key]) {
      map[key] = issue.message;
    }
  }
  return map;
}

export function validateWizardStep(
  stepIndex: number,
  values: CadastroComercioFormValues,
): Record<string, string> {
  const schema = STEP_SCHEMAS[stepIndex];
  if (!schema) return {};
  const result = schema.safeParse(values);
  return result.success ? {} : fieldErrorsFromZod(result.error);
}
