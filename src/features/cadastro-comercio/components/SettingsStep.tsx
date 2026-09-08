import { Input } from '@/components/ui/input';
import { FormField } from './FormField';
import type { CadastroComercioFormValues } from '../schemas';

interface SettingsStepProps {
  values: CadastroComercioFormValues;
  imageName: string | null;
  onToggle: (field: 'notificarAgendamento' | 'lembrarAgendamento' | 'resumoDiario', checked: boolean) => void;
  onImageChange: (file: File | null) => void;
}

export function SettingsStep({ values, imageName, onToggle, onImageChange }: SettingsStepProps) {
  return (
    <div className="space-y-5">
      <FormField htmlFor="image" label="Logo / imagem" hint={imageName ?? 'Opcional. PNG ou JPG.'}>
        <Input
          id="image"
          type="file"
          accept="image/*"
          onChange={(event) => onImageChange(event.target.files?.[0] ?? null)}
        />
      </FormField>

      <fieldset className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Notificações
        </legend>
        <NotificationToggle
          id="notificarAgendamento"
          checked={values.notificarAgendamento}
          label="Notificar sobre novos agendamentos"
          onChange={(checked) => onToggle('notificarAgendamento', checked)}
        />
        <NotificationToggle
          id="lembrarAgendamento"
          checked={values.lembrarAgendamento}
          label="Lembrar clientes dos agendamentos"
          onChange={(checked) => onToggle('lembrarAgendamento', checked)}
        />
        <NotificationToggle
          id="resumoDiario"
          checked={values.resumoDiario}
          label="Enviar resumo diário de compromissos"
          onChange={(checked) => onToggle('resumoDiario', checked)}
        />
      </fieldset>
    </div>
  );
}

function NotificationToggle({
  id,
  checked,
  label,
  onChange,
}: {
  id: string;
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 rounded border-border accent-primary"
      />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}
