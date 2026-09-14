import { formatApiErrorPayload } from './formatApiErrorMessage';
import { isExpiredSessionUnauthorized } from './isExpiredSessionUnauthorized';
import {
  ApiError,
  NETWORK_ERROR_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
  describeApiErrorBody,
} from './errors';

/** Status sintético para falha de transporte (offline, DNS, CORS, servidor fora). */
const NETWORK_ERROR_STATUS = 0;

function dispatchErrorToast(message: string): void {
  window.dispatchEvent(
    new CustomEvent('global-toast', { detail: { type: 'error', message } }),
  );
}

// Deixamos a API_URL vazia para que o frontend faça requisições relativas (ex: /api/Login).
// Isso faz com que as requisições passem pelo proxy do Vite (localmente) e pelo proxy do Vercel (em produção),
// resolvendo completamente qualquer erro de CORS ("Failed to fetch").
export const API_URL = '';

export type FetchApiOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
  skipToast?: boolean;
  /** Retorna [] em GET 404 sem logar erro (listas vazias na API .NET). */
  notFoundAsEmpty?: boolean;
  _retry?: boolean;
};

let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

/**
 * Lê o JWT da sessão. Exportada porque services que não podem passar por `fetchApi`
 * (ex.: os que precisam do corpo de erro em texto puro) precisam do mesmo token,
 * e duplicar as chaves de storage já causou divergência antes.
 */
export function resolveAuthToken(): string | null {
  const direct = localStorage.getItem('token');
  if (direct) return direct;

  const storedAuth = localStorage.getItem('agendaAi_auth');
  if (!storedAuth) return null;

  try {
    const parsed = JSON.parse(storedAuth) as { token?: string };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

export async function fetchApi(endpoint: string, options: FetchApiOptions = {}): Promise<any> {
  const token = resolveAuthToken();

  const headers = new Headers(options.headers || {});

  let body: BodyInit | null | undefined;
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    body = JSON.stringify(options.body);
  } else {
    body = options.body as BodyInit | null | undefined;
  }

  // Only set default content-type if not FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      body,
      headers,
    });
  } catch (networkError) {
    // `fetch` só rejeita em falha de transporte — vira TypeError("Failed to fetch"),
    // que antes chegava cru na tela. Aqui já sai traduzido.
    console.error(`API Network Error (${path}):`, networkError);
    if (!options.skipToast) {
      dispatchErrorToast(NETWORK_ERROR_MESSAGE);
    }
    throw new ApiError({
      friendlyMessage: NETWORK_ERROR_MESSAGE,
      status: NETWORK_ERROR_STATUS,
      rawMessage: networkError instanceof Error ? networkError.message : String(networkError),
      payload: networkError,
    });
  }

  const method = options.method?.toUpperCase() || 'GET';
  
  const skipToast = options.skipToast;

  if (!response.ok) {
    if (options.notFoundAsEmpty && response.status === 404 && method === 'GET') {
      return [];
    }

    const isLoginRoute = /\/api\/login\//i.test(path);
    const unauthorizedMessage =
      response.status === 401 ? await parseApiMessage(response.clone()) : '';
    const shouldRefreshSession =
      response.status === 401 &&
      Boolean(token) &&
      !isLoginRoute &&
      !options._retry &&
      isExpiredSessionUnauthorized(unauthorizedMessage);
    
    if (shouldRefreshSession) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_URL}/api/Login/refresh-token`, {
            method: 'POST',
            credentials: 'include', // API needs the refresh_token cookie
          });
          
          if (refreshRes.ok) {
            const data = await refreshRes.json().catch(() => null);
            let newToken = null;
            if (data && typeof data === 'object') {
              // The API audit says: "Retorna access_token + refresh_token"
              newToken = data.access_token || data.token;
            }
            
            if (newToken) {
              localStorage.setItem('token', newToken);
              const storedAuthRaw = localStorage.getItem('agendaAi_auth');
              if (storedAuthRaw) {
                try {
                  const storedAuth = JSON.parse(storedAuthRaw);
                  storedAuth.token = newToken;
                  localStorage.setItem('agendaAi_auth', JSON.stringify(storedAuth));
                } catch (e) {}
              }
              
              isRefreshing = false;
              onRefreshed(newToken);
              
              // Remove the old Authorization header before retrying
              const retryOptions = { ...options, _retry: true };
              if (retryOptions.headers) {
                const newHeaders = new Headers(retryOptions.headers);
                newHeaders.delete('Authorization');
                retryOptions.headers = newHeaders;
              }
              return fetchApi(endpoint, retryOptions);
            }
          }
          throw new ApiError({
            friendlyMessage: SESSION_EXPIRED_MESSAGE,
            status: 401,
            rawMessage: 'Refresh token failed',
          });
        } catch (error) {
          isRefreshing = false;
          onRefreshed(null);
          window.dispatchEvent(new CustomEvent('agendaai:session-expired'));
          // A causa técnica da falha de refresh (rede, parse, 500) não interessa
          // ao usuário e não pode vazar: o que ele precisa saber é que expirou.
          if (error instanceof ApiError) throw error;
          console.error('Falha ao renovar a sessão:', error);
          throw new ApiError({
            friendlyMessage: SESSION_EXPIRED_MESSAGE,
            status: 401,
            rawMessage: error instanceof Error ? error.message : String(error),
            payload: error,
          });
        }
      } else {
        // Wait for the ongoing refresh
        const newToken = await new Promise<string | null>(resolve => {
          subscribeTokenRefresh(resolve);
        });
        
        if (newToken) {
          const retryOptions = { ...options, _retry: true };
          if (retryOptions.headers) {
            const newHeaders = new Headers(retryOptions.headers);
            newHeaders.delete('Authorization');
            retryOptions.headers = newHeaders;
          }
          return fetchApi(endpoint, retryOptions);
        } else {
          window.dispatchEvent(new CustomEvent('agendaai:session-expired'));
          throw new ApiError({
            friendlyMessage: SESSION_EXPIRED_MESSAGE,
            status: 401,
            rawMessage: 'Refresh token failed (aguardando refresh em andamento)',
          });
        }
      }
    }

    const errorData: unknown = await response.json().catch(() => null);
    console.error(`API Error (${response.status}) em ${path}:`, errorData);

    const { friendlyMessage, rawMessage, isGenericMessage } = describeApiErrorBody(
      errorData,
      response.status,
    );

    if (!skipToast) {
      dispatchErrorToast(friendlyMessage);
    }

    throw new ApiError({
      friendlyMessage,
      status: response.status,
      rawMessage,
      payload: errorData,
      isGenericMessage,
    });
  }

  // Handle successful CRUD (POST, PUT, DELETE)
  if (!skipToast && ['POST', 'PUT', 'DELETE'].includes(method)) {
    let message = 'Operação realizada com sucesso!';
    if (method === 'POST') message = 'Cadastrado com sucesso!';
    if (method === 'PUT') message = 'Atualizado com sucesso!';
    if (method === 'DELETE') message = 'Excluído com sucesso!';
    
    // Avoid showing success toast for GET or neutral calls like fetching tokens
    if (!path.toLowerCase().includes('login') && !path.toLowerCase().includes('auth')) {
       window.dispatchEvent(new CustomEvent('global-toast', { 
        detail: { type: 'success', message } 
      }));
    }
  }

  // Handle empty responses
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (e) {
    return text;
  }
}

/**
 * Helpers para chamadas cruas, sem passar por `fetchApi`.
 *
 * `fetchApi` engole o status HTTP (só propaga a mensagem) e dispara toasts
 * automáticos em POST/PUT/DELETE. Services que precisam distinguir 401 de 403,
 * ou tratar como caso de negócio o que a API devolveu como erro, usam estes.
 * O preço é não herdar o refresh-token automático — quem usa isto trata o 401.
 */
export function buildAuthHeaders(): HeadersInit {
  const token = resolveAuthToken();
  const headers: Record<string, string> = {
    accept: '*/*',
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Extrai a mensagem de uma resposta da API .NET, que ora devolve string pura
 * (`Ok("...")` / `BadRequest("...")`), ora um envelope message/error/detail/title.
 */
export async function parseApiMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (!text.trim()) return '';

  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed === 'string') return parsed.trim();
    if (parsed && typeof parsed === 'object') {
      return formatApiErrorPayload(parsed, '');
    }
  } catch {
    // corpo em texto puro
  }

  return text.trim();
}
