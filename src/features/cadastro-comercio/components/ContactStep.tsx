import { Input } from '@/components/ui/input';
import { FormField } from './FormField';
import type { CadastroComercioFormValues } from '../schemas';

interface ContactStepProps {
  values: CadastroComercioFormValues;
  fieldErrors: Record<string, string>;
  onChange: (field: keyof CadastroComercioFormValues, value: string) => void;
}

export function ContactStep({ values, fieldErrors, onChange }: ContactStepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField htmlFor="telefone" label="Telefone" error={fieldErrors.telefone}>
          <Input
            id="telefone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(00) 00000-0000"
            maxLength={15}
            value={values.telefone}
            aria-invalid={Boolean(fieldErrors.telefone)}
            onChange={(event) => onChange('telefone', event.target.value)}
          />
        </FormField>
        <FormField htmlFor="email" label="E-mail" error={fieldErrors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="contato@empresa.com"
            value={values.email}
            aria-invalid={Boolean(fieldErrors.email)}
            onChange={(event) => onChange('email', event.target.value)}
          />
        </FormField>
      </div>

      <FormField htmlFor="instagram" label="Instagram" error={fieldErrors.instagram}>
        <Input
          id="instagram"
          placeholder="@seu-perfil"
          value={values.instagram}
          onChange={(event) => onChange('instagram', event.target.value)}
        />
      </FormField>
      <FormField htmlFor="facebook" label="Facebook" error={fieldErrors.facebook}>
        <Input
          id="facebook"
          placeholder="facebook.com/perfil"
          value={values.facebook}
          onChange={(event) => onChange('facebook', event.target.value)}
        />
      </FormField>
      <FormField htmlFor="site" label="Site" error={fieldErrors.site}>
        <Input
          id="site"
          inputMode="url"
          placeholder="www.seu-site.com"
          value={values.site}
          onChange={(event) => onChange('site', event.target.value)}
        />
      </FormField>
    </div>
  );
}
