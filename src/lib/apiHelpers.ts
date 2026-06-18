/** Utilitários para normalizar respostas da API .NET no frontend. */

const NAME_ID_CLAIM =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

const ROLE_CLAIM =
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

export type ApiPermissao = 'Cliente' | 'Profissional' | 'Admin';
export type AppUserType = 'cliente' | 'estabelecimento' | 'profissional';

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

/** Extrai a role/permissão do JWT (Cliente, Profissional, Admin). */
export function getRoleFromToken(token: string): ApiPermissao | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const role = payload[ROLE_CLAIM] || payload.role;
  if (role === 'Admin' || role === 'Profissional' || role === 'Cliente') {
    return role;
  }
  return null;
}

/** Converte permissão da API para o tipo de área do app. */
export function apiPermissaoToUserType(
  permissao: string | null | undefined
): AppUserType {
  if (permissao === 'Admin') return 'estabelecimento';
  if (permissao === 'Profissional') return 'profissional';
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

/** Converte respostas que podem ser array, string vazia ou null em array. */
export function normalizeApiList<T>(data: unknown, emptyMarkers: string[] = []): T[] {
  if (Array.isArray(data)) return data as T[];
  if (typeof data === 'string' && emptyMarkers.some((m) => data.includes(m))) {
    return [];
  }
  return [];
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
    if (err instanceof Error && (err.message.includes('404') || err.message.includes('403'))) {
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
