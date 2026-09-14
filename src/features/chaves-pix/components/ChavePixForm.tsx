import React, { useId, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  ChavePixFormSchema,
  TIPO_CHAVE_PIX_LABEL,
  TIPO_CHAVE_PIX_VALUES,
  type ChavePixFormInput,
  type TipoChavePix,
} from '../schemas';

const TIPO_OPTIONS = TIPO_CHAVE_PIX_VALUES.map((tipo) => ({
  value: tipo,
  label: TIPO_CHAVE_PIX_LABEL[tipo],
}));

const PLACEHOLDER_BY_TIPO: Record<TipoChavePix, string> = {
  CPF: '000.000.000-00',
  CNPJ: '00.000.000/0000-00',
  Email: 'financeiro@seudominio.com.br',
  Telefone: '31988887777',
  Aleatoria: '123e4567-e89b-12d3-a456-426614174000',
};

interface ChavePixFormProps {
  submitLabel: string;
  initialChave?: string;
  initialTipoChave?: TipoChavePix;
  isSubmitting: boolean;
  onSubmit: (values: ChavePixFormInput) => Promise<void>;
  onCancel?: () => void;
}

export function ChavePixForm({
  submitLabel,
  initialChave = '',
  initialTipoChave = 'CPF',
  isSubmitting,
  onSubmit,
  onCancel,
}: ChavePixFormProps) {
  const formId = useId();
  const [tipoChave, setTipoChave] = useState<TipoChavePix>(initialTipoChave);
  const [chave, setChave] = useState(initialChave);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const tipoId = `${formId}-tipo`;
  const chaveId = `${formId}-chave`;
  const chaveErrorId = `${formId}-chave-error`;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});

    const parsed = ChavePixFormSchema.safeParse({ chave, tipoChave });
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

    await onSubmit(parsed.data);
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor={tipoId} className="text-sm font-medium text-foreground">
          Tipo de chave
        </label>
        <div id={tipoId}>
          <SearchableSelect
            options={TIPO_OPTIONS}
            value={tipoChave}
            onChange={(value) => setTipoChave(value as TipoChavePix)}
            placeholder="Selecione o tipo"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={chaveId} className="text-sm font-medium text-foreground">
          Chave PIX
        </label>
        <Input
          id={chaveId}
          value={chave}
          onChange={(event) => setChave(event.target.value)}
          placeholder={PLACEHOLDER_BY_TIPO[tipoChave]}
          inputMode={tipoChave === 'Email' || tipoChave === 'Aleatoria' ? 'text' : 'numeric'}
          autoComplete="off"
          aria-invalid={Boolean(fieldErrors.chave)}
          aria-describedby={fieldErrors.chave ? chaveErrorId : undefined}
        />
        {fieldErrors.chave ? (
          <p id={chaveErrorId} className="text-sm text-destructive" role="alert">
            {fieldErrors.chave}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" className="min-h-11" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            submitLabel
          )}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" className="min-h-11" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}
