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
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
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
