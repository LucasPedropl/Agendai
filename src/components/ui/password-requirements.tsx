import { Check, X } from 'lucide-react';
import { checkPasswordRules } from '@/lib/passwordRules';

interface PasswordRequirementsProps {
  password: string;
}

/** Checklist ao vivo das regras de senha (mesmo contrato do PagWeb). Some com o campo vazio. */
export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  if (!password) return null;

  const rules = checkPasswordRules(password);

  return (
    <ul className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1.5" aria-live="polite">
      {rules.map((rule) => (
        <li
          key={rule.id}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            rule.met ? 'text-emerald-600' : 'text-muted-foreground'
          }`}
        >
          {rule.met ? (
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          <span>{rule.label}</span>
        </li>
      ))}
    </ul>
  );
}
