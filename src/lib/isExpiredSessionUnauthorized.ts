/**
 * A API AgendaAi usa HTTP 401 tanto para JWT inválido/expirado quanto para
 * recusa de autorização (ex.: "Você não tem permissão para adicionar usuários").
 * Só o primeiro caso deve disparar refresh + logout.
 */
const EXPIRED_SESSION_MESSAGE_PATTERN =
  /token|sess[aã]o expir|expirad|n[aã]o autenticado|unauthenticated/i;

export function isExpiredSessionUnauthorized(errorMessage: string): boolean {
  const trimmed = errorMessage.trim();
  if (!trimmed) {
    return true;
  }
  return EXPIRED_SESSION_MESSAGE_PATTERN.test(trimmed);
}
