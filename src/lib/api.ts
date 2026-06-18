// Deixamos a API_URL vazia para que o frontend faça requisições relativas (ex: /api/Login).
// Isso faz com que as requisições passem pelo proxy do Vite (localmente) e pelo proxy do Vercel (em produção),
// resolvendo completamente qualquer erro de CORS ("Failed to fetch").
export const API_URL = '';

export type FetchApiOptions = RequestInit & {
  skipToast?: boolean;
  /** Retorna [] em GET 404 sem logar erro (listas vazias na API .NET). */
  notFoundAsEmpty?: boolean;
};

export async function fetchApi(endpoint: string, options: FetchApiOptions = {}) {
  let token = localStorage.getItem('token');
  
  if (!token) {
    const storedAuth = localStorage.getItem('agendaAi_auth');
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        if (parsed.token) {
          token = parsed.token;
        }
      } catch (e) {
        // ignore
      }
    }
  }
  
  const headers = new Headers(options.headers || {});

  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    body = JSON.stringify(body);
  }

  // Only set default content-type if not FormData
  if (!(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    body,
    headers,
  });

  const method = options.method?.toUpperCase() || 'GET';
  
  const skipToast = options.skipToast;

  if (!response.ok) {
    if (options.notFoundAsEmpty && response.status === 404 && method === 'GET') {
      return [];
    }

    const isLoginRoute = /\/api\/login\//i.test(path);
    if (response.status === 401 && token && !isLoginRoute) {
      window.dispatchEvent(new CustomEvent('agendaai:session-expired'));
    }

    const errorData: unknown = await response.json().catch(() => ({}));
    console.error(`API Error (${response.status}):`, errorData);

    let message = `Erro na operação: ${response.status} ${response.statusText}`;

    if (typeof errorData === 'string' && errorData.trim()) {
      message = errorData.trim();
    } else if (errorData && typeof errorData === 'object') {
      const err = errorData as Record<string, unknown>;
      const validationErrors = err.errors && typeof err.errors === 'object'
        ? Object.entries(err.errors as Record<string, string[]>)
            .map(([key, val]) => `${key}: ${val.join(', ')}`)
            .join(' | ')
        : '';

      message =
        (typeof err.message === 'string' && err.message) ||
        (typeof err.error === 'string' && err.error) ||
        (typeof err.detail === 'string' && err.detail) ||
        (typeof err.title === 'string' && err.title) ||
        validationErrors ||
        message;
    }
    
    if (!skipToast) {
      window.dispatchEvent(new CustomEvent('global-toast', { 
        detail: { type: 'error', message } 
      }));
    }
    
    throw new Error(message);
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
