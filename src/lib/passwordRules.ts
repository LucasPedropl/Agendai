export interface PasswordRule {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

/**
 * Mesmas regras do PagWeb. Lista, não um regex único, para a tela dizer
 * qual regra ainda falta. "Número ou símbolo" é uma regra só (disjunção).
 */
export const passwordRules: PasswordRule[] = [
  { id: 'length', label: 'Pelo menos 8 caracteres', test: (value) => value.length >= 8 },
  { id: 'upper', label: 'Uma letra maiúscula', test: (value) => /\p{Lu}/u.test(value) },
  { id: 'lower', label: 'Uma letra minúscula', test: (value) => /\p{Ll}/u.test(value) },
  { id: 'number', label: 'Um número ou símbolo', test: (value) => /[\p{N}\p{P}\p{S}]/u.test(value) },
];

export const PASSWORD_INVALID_MESSAGE =
  'A senha deve conter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula e um número ou símbolo especial.';

export function checkPasswordRules(password: string) {
  return passwordRules.map((rule) => ({
    id: rule.id,
    label: rule.label,
    met: rule.test(password),
  }));
}

export function isValidPassword(password: string): boolean {
  return passwordRules.every((rule) => rule.test(password));
}
