/** Utilitários para normalizar respostas da API .NET no frontend. */

import { hasApiStatus } from './errors';

/** PUT /api/Usuario/Config-Usuario/{guid} retorna 400 até correção no backend. */
export const IS_CONFIG_USUARIO_PUT_BLOCKED = true;

/** POST Comercio-Agendar grava UsuarioId errado (profissional no lugar do cliente). */
export const IS_ADMIN_AGENDA_CLIENT_NAME_UNRELIABLE = true;

const NAME_ID_CLAIM =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

const ROLE_CLAIM =
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

export type ApiPermissao = 'Cliente' | 'Profissional' | 'Admin' | 'Master';
export type AppUserType = 'cliente' | 'estabelecimento' | 'profissional';

export const MASTER_LOGIN_BLOCKED_MESSAGE =
  'Esta credencial pertence ao painel administrativo Master (agendai-admin). Use o aplicativo correto para acessar.';

export const ADMIN_ACCESS_DENIED_MESSAGE =
  'Acesso negado à área administrativa. Verifique se sua conta possui permissão de administrador do estabelecimento.';

function decodeJwtPayload(token: string): Record<string, string> | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;
    return JSON.parse(
      atob(segment.replace(/-/g, '+').replace(/_/g, '/'))
    ) as Record<string, string>;
  } catch {
    return null;
  }
}

/** Extrai o userId (GUID) do payload JWT. */
export function getUserIdFromToken(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return payload[NAME_ID_CLAIM] || payload.sub || payload.nameid || null;
}

/** Extrai a role/permissão do JWT (Cliente, Profissional, Admin, Master). */
export function getRoleFromToken(token: string): ApiPermissao | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const role = payload[ROLE_CLAIM] || payload.role;
  if (role === 'Admin' || role === 'Profissional' || role === 'Cliente' || role === 'Master') {
    return role;
  }
  return null;
}

/** Lê `permissao` ou `Permissao` do body de login/registro. */
export function extractPermissaoFromAuthResponse(
  response: Record<string, unknown>
): string | null {
  const raw = response.permissao ?? response.Permissao;
  return typeof raw === 'string' ? raw.trim() : null;
}

/** Credencial de serviço Master — não pertence a este app. */
export function isMasterCredential(
  permissao: string | null | undefined,
  token?: string
): boolean {
  if (permissao?.toLowerCase() === 'master') return true;
  if (token) {
    const role = getRoleFromToken(token);
    if (role === 'Master') return true;
  }
  return false;
}

/** Converte permissão da API para o tipo de área do app. Master não é mapeado — use `isMasterCredential`. */
export function apiPermissaoToUserType(
  permissao: string | null | undefined
): AppUserType {
  if (permissao === 'Admin') return 'estabelecimento';
  if (permissao === 'Profissional') return 'profissional';
  if (permissao === 'Master') return 'cliente';
  return 'cliente';
}

/** Resolve o tipo de usuário a partir do token e/ou body do login. */
export function resolveUserTypeFromAuth(
  token: string,
  responsePermissao?: string | null
): AppUserType {
  const fromResponse = responsePermissao?.trim();
  if (fromResponse) {
    return apiPermissaoToUserType(fromResponse);
  }
  return apiPermissaoToUserType(getRoleFromToken(token));
}

/** Rota inicial por tipo de usuário. */
export function getDashboardPath(userType: AppUserType): string {
  if (userType === 'cliente') return '/app';
  if (userType === 'profissional') return '/profissional/dashboard';
  return '/estabelecimento/dashboard';
}

/** Verifica se o tipo do token pode acessar a rota protegida. */
export function canAccessRoute(
  tokenUserType: AppUserType,
  allowedType: AppUserType | AppUserType[]
): boolean {
  if (Array.isArray(allowedType)) {
    return allowedType.includes(tokenUserType);
  }
  return tokenUserType === allowedType;
}

/** Converte respostas que podem ser array, objeto com `agendamentos`, string vazia ou null em array. */
export function normalizeApiList<T>(data: unknown, emptyMarkers: string[] = []): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const nested = record.agendamentos ?? record.Agendamentos;
    if (Array.isArray(nested)) return nested as T[];
  }
  if (typeof data === 'string' && emptyMarkers.some((m) => data.includes(m))) {
    return [];
  }
  return [];
}

/** Mês atual (1–12) para path param `periodo` de Comercio-Historico. Use `0` para todos os meses. */
export function getHistoricoPeriodoAtual(): string {
  return String(new Date().getMonth() + 1);
}

export interface ComercioHistoricoPathParams {
  comercioId: number;
  periodo?: number | string;
  status?: string | null;
  profissionalId?: string | null;
}

/**
 * Monta GET /api/Agenda/Comercio-Historico/{id}/{periodo}/{status?}/{profissional?}.
 * - `periodo`: int; 0 ou fora de 1–12 = sem filtro de mês.
 * - Segmentos finais vazios são omitidos; `status`/`profissional` são encodados.
 * - ASP.NET não permite `profissional` sem `status` — sentinela `_` quando só profissional.
 */
export function buildComercioHistoricoPath({
  comercioId,
  periodo,
  status,
  profissionalId,
}: ComercioHistoricoPathParams): string {
  const periodoSegment =
    periodo !== undefined && periodo !== null ? String(periodo) : '0';
  let path = `/api/Agenda/Comercio-Historico/${comercioId}/${periodoSegment}`;

  const trimmedStatus = status?.trim() ?? '';
  const trimmedProfissional = profissionalId?.trim() ?? '';

  if (trimmedStatus) {
    path += `/${encodeURIComponent(trimmedStatus)}`;
    if (trimmedProfissional) {
      path += `/${encodeURIComponent(trimmedProfissional)}`;
    }
  } else if (trimmedProfissional) {
    // Sentinela: não casa com Concluido/Cancelado/Não compareceu — sem filtro extra de status.
    path += `/_/${encodeURIComponent(trimmedProfissional)}`;
  }

  return path;
}

/** Lê horários disponíveis independente do casing (camelCase / PascalCase). */
export function extractHorariosDisponiveis(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;
  const slots = record.horariosDisponiveis ?? record.HorariosDisponiveis;
  return Array.isArray(slots) ? (slots as string[]) : [];
}

/** Formata horário HH:mm para TimeSpan da API (HH:mm:ss). */
export function toApiTimeSpan(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

export interface ComercioSummary {
  id: number;
  nome?: string;
  [key: string]: unknown;
}

/** Lista clientes ou profissionais vinculados ao comércio. 404 = sem registros. */
export async function fetchComercioUsuariosList<T>(
  fetchApiFn: (
    endpoint: string,
    options?: RequestInit & { skipToast?: boolean; notFoundAsEmpty?: boolean }
  ) => Promise<unknown>,
  tipo: 'Clientes' | 'Profissionais',
  comercioId: number
): Promise<T[]> {
  const data = await fetchApiFn(`/api/ComercioUsuarios/${tipo}/${comercioId}`, {
    skipToast: true,
    notFoundAsEmpty: true,
  });
  return normalizeApiList<T>(data);
}

/** Lista comércios do usuário admin autenticado. 404 = sem vínculo (lista vazia). */
export async function fetchAdminComercios(
  fetchApiFn: (
    endpoint: string,
    options?: RequestInit & { skipToast?: boolean }
  ) => Promise<unknown>
): Promise<ComercioSummary[]> {
  try {
    const data = await fetchApiFn('/api/Comercios/Admin', { skipToast: true });
    if (Array.isArray(data)) return data as ComercioSummary[];
    if (data && typeof data === 'object' && 'id' in data) {
      return [data as ComercioSummary];
    }
    return [];
  } catch (err) {
    if (hasApiStatus(err, 403)) {
      throw new Error(ADMIN_ACCESS_DENIED_MESSAGE);
    }
    if (hasApiStatus(err, 404)) {
      return [];
    }
    throw err;
  }
}

/** Mapeia status de sessão WhatsApp da API para estado da UI. */
export function mapWhatsAppStatus(raw: string | null | undefined): string {
  if (!raw) return 'DISCONNECTED';
  const lower = raw.toLowerCase();
  if (lower === 'connected' || lower === 'conectado') return 'CONNECTED';
  if (lower.includes('qr') || lower === 'qrcode_ready') return 'QRCODE_READY';
  if (
    lower.includes('erro') ||
    lower.includes('sessão não encontrada') ||
    lower.includes('sessao nao encontrada')
  ) {
    return 'ERROR';
  }
  if (lower.includes('desconect') || lower === 'disconnected') return 'DISCONNECTED';
  return raw.toUpperCase();
}
