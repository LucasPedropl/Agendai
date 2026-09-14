/**
 * ASP.NET devolve `errors` em formatos incompatíveis:
 * ModelState → `{ campo: ["msg"] }`
 * Identity (`ConfirmEmailAsync`) → `[{ code, description }]`
 * `Object.entries` + `val.join` no array do Identity explode (`val` é objeto).
 */
export function formatApiErrorPayload(
  errorData: unknown,
  fallback = 'Erro na operação',
): string {
  if (typeof errorData === 'string' && errorData.trim()) {
    return errorData.trim();
  }
  if (!errorData || typeof errorData !== 'object') {
    return fallback;
  }

  const record = errorData as Record<string, unknown>;
  const fromErrors = formatErrorsField(record.errors);
  const envelope =
    pickNonEmptyString(record.message) ||
    pickNonEmptyString(record.error) ||
    pickNonEmptyString(record.detail) ||
    pickNonEmptyString(record.title);

  if (fromErrors && isIdentityInvalidToken(fromErrors)) {
    return 'Link de ativação inválido ou expirado. Solicite um novo e-mail ou cadastre novamente.';
  }

  if (envelope && fromErrors && envelope !== fromErrors) {
    if (envelope === 'Erro ao confirmar e-mail.') {
      return fromErrors;
    }
    return `${envelope} ${fromErrors}`;
  }

  return envelope || fromErrors || fallback;
}

function formatErrorsField(errors: unknown): string {
  if (!errors) return '';
  if (Array.isArray(errors)) {
    return errors.map(formatSingleError).filter(Boolean).join(' | ');
  }
  if (typeof errors === 'object') {
    return Object.entries(errors as Record<string, unknown>)
      .map(([key, val]) => {
        const text = formatErrorValue(val);
        return text ? `${key}: ${text}` : key;
      })
      .join(' | ');
  }
  if (typeof errors === 'string') return errors;
  return '';
}

function formatErrorValue(val: unknown): string {
  if (Array.isArray(val)) {
    return val.map(formatSingleError).filter(Boolean).join(', ');
  }
  if (typeof val === 'string') return val;
  return formatSingleError(val);
}

function formatSingleError(item: unknown): string {
  if (typeof item === 'string') return item;
  if (!item || typeof item !== 'object') return '';
  const record = item as Record<string, unknown>;
  if (typeof record.description === 'string' && record.description.trim()) {
    return record.description.trim();
  }
  if (typeof record.code === 'string' && record.code.trim()) {
    return record.code.trim();
  }
  return '';
}

function pickNonEmptyString(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function isIdentityInvalidToken(text: string): boolean {
  return /invalid\s*token/i.test(text);
}
