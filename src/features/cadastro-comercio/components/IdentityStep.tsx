import { Input } from '@/components/ui/input';
import { FormField, TextAreaField } from './FormField';
import type { CadastroComercioFormValues } from '../schemas';

interface IdentityStepProps {
  values: CadastroComercioFormValues;
  fieldErrors: Record<string, string>;
  onChange: (field: keyof CadastroComercioFormValues, value: string) => void;
}

export function IdentityStep({ values, fieldErrors, onChange }: IdentityStepProps) {
  return (
    <div className="space-y-4">
      <FormField htmlFor="nome" label="Nome do comércio" error={fieldErrors.nome}>
        <Input
          id="nome"
          autoComplete="organization"
          placeholder="Ex: Salão Beleza Pura"
          value={values.nome}
          aria-invalid={Boolean(fieldErrors.nome)}
          onChange={(event) => onChange('nome', event.target.value)}
        />
      </FormField>
      <FormField htmlFor="cnpj" label="CNPJ" error={fieldErrors.cnpj}>
        <Input
          id="cnpj"
          inputMode="numeric"
          autoComplete="off"
          placeholder="00.000.000/0000-00"
          maxLength={18}
          value={values.cnpj}
          aria-invalid={Boolean(fieldErrors.cnpj)}
          onChange={(event) => onChange('cnpj', event.target.value)}
        />
      </FormField>
      <FormField
        htmlFor="descricao"
        label="Descrição"
        error={fieldErrors.descricao}
        hint="O que o cliente precisa saber antes de agendar."
      >
        <TextAreaField
          id="descricao"
          rows={3}
          placeholder="Conte um pouco sobre o seu negócio..."
          value={values.descricao}
          hasError={Boolean(fieldErrors.descricao)}
          aria-invalid={Boolean(fieldErrors.descricao)}
          onChange={(event) => onChange('descricao', event.target.value)}
        />
      </FormField>
    </div>
  );
}
