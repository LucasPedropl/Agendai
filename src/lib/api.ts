// Deixamos a API_URL vazia para que o frontend faça requisições relativas (ex: /api/Login).
// Isso faz com que as requisições passem pelo proxy do Vite (localmente) e pelo proxy do Vercel (em produção),
// resolvendo completamente qualquer erro de CORS ("Failed to fetch").
export const API_URL = '';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
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

  // Only set default content-type if not FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const method = options.method?.toUpperCase() || 'GET';
  
  // Flag to avoid conflicting with manual toasts on some pages, optional
  const skipToast = (options as any).skipToast;

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`API Error (${response.status}):`, errorData);
    
    // Extract validation errors if present (Common in .NET APIs for example)
    const validationErrors = errorData.errors ? 
      Object.entries(errorData.errors).map(([key, val]) => `${key}: ${(val as string[]).join(', ')}`).join(' | ') : 
      '';

    const message = errorData.message || errorData.error || validationErrors || `Erro na operação: ${response.status} ${response.statusText}`;
    
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
