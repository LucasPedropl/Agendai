/**
 * Camada única de tradução de erro técnico → mensagem para o usuário final.
 *
 * Regra do app: nada que o usuário lê pode vir de `error.message` cru. A API .NET
 * devolve desde string em PT-BR (que serve) até `ModelState` em inglês, exceção
 * serializada e página HTML de gateway (que não servem). Fora isso, um `TypeError`
 * do próprio front (ex.: `val.join is not a function`) cai no mesmo `catch` e ia
 * parar na tela. Tudo passa por `getFriendlyErrorMessage` antes de ser exibido.
 */

import { formatApiErrorPayload } from './formatApiErrorMessage';

export const GENERIC_ERROR_MESSAGE =
  'Não foi possível concluir a operação. Tente novamente em alguns instantes.';

export const NETWORK_ERROR_MESSAGE =
  'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.';

export const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Faça login novamente.';

/** Erro de API já traduzido: `message` é seguro para exibir, `rawMessage` é só para log. */
export class ApiError extends Error {
  readonly status: number;
  readonly rawMessage: string;
  readonly payload: unknown;
  /** `true` quando a API não devolveu nada aproveitável e a mensagem veio do status. */
  readonly isGenericMessage: boolean;

  constructor(params: {
    friendlyMessage: string;
    status: number;
    rawMessage?: string;
    payload?: unknown;
    isGenericMessage?: boolean;
  }) {
    super(params.friendlyMessage);
    this.name = 'ApiError';
    this.status = params.status;
    this.rawMessage = params.rawMessage ?? params.friendlyMessage;
    this.payload = params.payload;
    this.isGenericMessage = params.isGenericMessage ?? false;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Substitui os antigos `error.message.includes('404')` — compara o status real. */
export function hasApiStatus(error: unknown, ...statuses: number[]): boolean {
  return isApiError(error) && statuses.includes(error.status);
}

/**
 * Padrões que identificam texto técnico. Tudo que casar é substituído pelo
 * fallback da tela — jamais chega ao usuário.
 */
const TECHNICAL_MESSAGE_PATTERNS: RegExp[] = [
  // Erros de runtime do próprio front que caíram no catch
  /\b(TypeError|ReferenceError|SyntaxError|RangeError|EvalError|URIError|AggregateError)\b/,
  /is not a function|is not defined|is not iterable|is not a constructor/i,
  /cannot read propert(y|ies)|cannot access|of (undefined|null)\b/i,
  /undefined is not|null is not an object/i,
  // Stack trace
  /\n\s*at\s/,
  /Traceback \(most recent call last\)/i,
  // Exceção serializada do backend .NET / Java
  /\b\w+Exception\b/,
  /object reference not set to an instance/i,
  /\b(System|Microsoft|java|javax|org\.springframework)\.[A-Za-z]/,
  /\b(stackTrace|innerException|traceId)\b/i,
  // Serialização / parsing
  /unexpected token|unexpected end of (json|input)/i,
  /the json value|could not be converted to|json\.parse/i,
  // Banco de dados
  /\b(select|insert into|update|delete from)\b[\s\S]*\b(from|where|values)\b/i,
  /sqlstate|\bORA-\d+|violates .* constraint|duplicate key value/i,
  // Infra / rede / configuração interna
  /failed to fetch|networkerror|load failed|\bERR_[A-Z_]+\b/i,
  /localhost|127\.0\.0\.1|\b0\.0\.0\.0\b|:\d{4,5}\/api\b/i,
  // Gateway devolveu HTML em vez de JSON
  /<!doctype|<html[\s>]/i,
  // Dumps gerados internamente por fetchApi/refresh antes desta camada existir
  /^erro na opera[çc][ãa]o:\s*\d{3}\b/i,
  /^refresh token failed$/i,
];

/** Texto tão longo, ou que começa com JSON cru, também é dump técnico. */
const MAX_USER_FACING_MESSAGE_LENGTH = 240;

export function isTechnicalErrorMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return true;
  if (trimmed.length > MAX_USER_FACING_MESSAGE_LENGTH) return true;
  if (/^[[{]/.test(trimmed)) return true;
  // Sem nenhuma letra (códigos, GUIDs soltos, números)
  if (!/[a-zA-ZÀ-ÿ]/.test(trimmed)) return true;
  return TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/** Falha de rede (offline, DNS, CORS, servidor fora) — `fetch` lança TypeError. */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /failed to fetch|networkerror|load failed|network request failed/i.test(error.message);
}

export function getHttpStatusMessage(status: number): string {
  switch (status) {
    case 400:
    case 422:
      return 'Não foi possível concluir: verifique os dados informados e tente novamente.';
    case 401:
      return SESSION_EXPIRED_MESSAGE;
    case 403:
      return 'Você não tem permissão para realizar esta ação.';
    case 404:
      return 'Não encontramos o registro solicitado.';
    case 408:
    case 504:
      return 'O servidor demorou para responder. Tente novamente.';
    case 409:
      return 'Esta operação conflita com um registro já existente.';
    case 413:
      return 'O arquivo enviado é maior do que o permitido.';
    case 429:
      return 'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.';
    default:
      if (status >= 500) {
        return 'O servidor está instável no momento. Tente novamente em alguns instantes.';
      }
      return GENERIC_ERROR_MESSAGE;
  }
}

function extractRawMessage(error: unknown): string {
  if (typeof error === 'string') return error.trim();
  if (error instanceof Error) return error.message.trim();
  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message.trim();
  }
  return '';
}

/**
 * Status cuja mensagem padrão já explica a causa melhor do que a tela explicaria.
 * 401 fica de fora de propósito: na tela de login, "sua sessão expirou" é errado —
 * o fallback da tela ("e-mail ou senha incorretos") é o certo.
 */
const SELF_EXPLANATORY_STATUSES = new Set([403, 404, 409, 413, 429]);

/**
 * Ponto único de leitura de erro pela UI.
 *
 * @param fallback mensagem da tela, usada quando o erro é técnico, vazio, ou quando
 *   a API não devolveu nada aproveitável (a tela sabe descrever a operação).
 */
export function getFriendlyErrorMessage(
  error: unknown,
  fallback: string = GENERIC_ERROR_MESSAGE,
): string {
  if (isNetworkError(error)) return NETWORK_ERROR_MESSAGE;

  // ApiError já nasceu traduzido em `fetchApi`.
  if (isApiError(error)) {
    if (!error.isGenericMessage) return error.message.trim() || fallback;
    if (SELF_EXPLANATORY_STATUSES.has(error.status)) return error.message;
    return fallback;
  }

  const raw = extractRawMessage(error);
  if (!raw || isTechnicalErrorMessage(raw)) return fallback;
  return raw;
}

/** `$.dataNascimento` → `Data nascimento`. Chave vazia/simbólica vira `''`. */
function humanizeFieldName(field: string): string {
  const cleaned = field.replace(/^\$\.?/, '').replace(/\[\d+\]/g, '').trim();
  if (!cleaned || !/[a-zA-ZÀ-ÿ]/.test(cleaned)) return '';
  const spaced = cleaned.replace(/[._]/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/** `errors` do ModelState nem sempre é `Record<string, string[]>` — daí o `val.join` quebrar. */
function toMessageList(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(toMessageList);
  if (typeof value === 'string') return [value.trim()];
  if (typeof value === 'number' || typeof value === 'boolean') return [String(value)];
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap(toMessageList);
  }
  return [];
}

const MAX_VALIDATION_PARTS = 3;

/** "E-mail já cadastrado." se basta; "é obrigatório" precisa do nome do campo. */
function isStandaloneSentence(text: string): boolean {
  return /^[A-ZÀ-Þ]/.test(text) && text.trim().split(/\s+/).length >= 3;
}

function extractValidationMessage(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const errors = (body as { errors?: unknown }).errors;
  if (!errors || typeof errors !== 'object') return '';

  const parts: string[] = [];
  for (const [field, value] of Object.entries(errors as Record<string, unknown>)) {
    for (const text of toMessageList(value)) {
      if (!text || isTechnicalErrorMessage(text)) continue;
      const label = isStandaloneSentence(text) ? '' : humanizeFieldName(field);
      const part = label ? `${label}: ${text}` : text;
      // Sem pontuação, duas mensagens seguidas viram uma frase só.
      parts.push(/[.!?]$/.test(part) ? part : `${part}.`);
      if (parts.length >= MAX_VALIDATION_PARTS) break;
    }
    if (parts.length >= MAX_VALIDATION_PARTS) break;
  }
  return parts.join(' ');
}

/** ModelState (`errors` como objeto campo→mensagens). O Identity manda array. */
function hasModelStateErrors(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const errors = (body as { errors?: unknown }).errors;
  return Boolean(errors) && typeof errors === 'object' && !Array.isArray(errors);
}

export interface ApiErrorDescription {
  /** Seguro para exibir. */
  friendlyMessage: string;
  /** O que a API respondeu de fato — só para `console.error` e matching interno. */
  rawMessage: string;
  /** `true` quando nada do corpo era aproveitável e a mensagem veio do status. */
  isGenericMessage: boolean;
}

/**
 * Traduz o corpo de uma resposta de erro da API em mensagem exibível.
 *
 * Duas fontes, com a ordem invertida conforme o formato do corpo:
 * - `extractValidationMessage` filtra campo a campo e omite o nome do campo quando
 *   a mensagem já é uma frase — melhor para ModelState.
 * - `formatApiErrorPayload` achata envelope + `errors` e traz mapeamentos PT-BR
 *   próprios (ex.: `InvalidToken` do Identity) — melhor para o resto.
 *
 * Se as duas saírem técnicas, cai na mensagem genérica derivada do status.
 */
export function describeApiErrorBody(body: unknown, status: number): ApiErrorDescription {
  const flattened = formatApiErrorPayload(body, '');
  const rawMessage = flattened || `HTTP ${status}`;

  const candidates = hasModelStateErrors(body)
    ? [extractValidationMessage(body), flattened]
    : [flattened, extractValidationMessage(body)];

  for (const candidate of candidates) {
    if (candidate && !isTechnicalErrorMessage(candidate)) {
      return { friendlyMessage: candidate, rawMessage, isGenericMessage: false };
    }
  }

  return {
    friendlyMessage: getHttpStatusMessage(status),
    rawMessage,
    isGenericMessage: true,
  };
}
