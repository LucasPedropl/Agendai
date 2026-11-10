import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { fetchApi } from '@/lib/api';
import {
  getUserIdFromToken,
  resolveUserTypeFromAuth,
  getDashboardPath,
  extractPermissaoFromAuthResponse,
  isMasterCredential,
  MASTER_LOGIN_BLOCKED_MESSAGE,
  type AppUserType,
} from '@/lib/apiHelpers';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useToast } from '@/contexts/ToastContext';
import { getFriendlyErrorMessage, hasApiStatus } from '@/lib/errors';

interface PasswordCredentialData {
  id: string;
  password: string;
  name?: string;
  iconURL?: string;
}

interface PasswordCredentialInstance extends Credential {
  readonly password?: string;
  readonly name?: string;
  readonly iconURL?: string;
}

interface PasswordCredentialConstructor {
  new (data: PasswordCredentialData | HTMLFormElement): PasswordCredentialInstance;
}

declare global {
  const PasswordCredential: PasswordCredentialConstructor;
  interface Window {
    PasswordCredential?: PasswordCredentialConstructor;
  }
  interface CredentialRequestOptions {
    password?: boolean;
  }
}

const REMEMBER_ME_KEY = 'agendai_remember_me';
const REMEMBER_EMAIL_KEY = 'agendai_remember_email';
const OLD_REMEMBER_PASSWORD_KEY = 'agendai_remember_password';

const typeLabels: Record<string, string> = {
  cliente: 'Cliente',
  profissional: 'Profissional',
  estabelecimento: 'Estabelecimento',
};

const QA_CREDENTIALS: Record<string, { email: string; password: string }> = {
  cliente: { email: 'cliente@agendai.dev', password: 'Senha@123' },
  profissional: { email: 'profissional@agendai.dev', password: 'Senha@123' },
  estabelecimento: { email: 'novo_estab@agendai.dev', password: 'Senha@123' },
};

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const type = (searchParams.get('type') as 'cliente' | 'estabelecimento' | 'profissional') || 'cliente';
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const isDev = import.meta.env.DEV;
  const defaults = isDev ? (QA_CREDENTIALS[type] ?? QA_CREDENTIALS.cliente) : { email: '', password: '' };
  const [rememberMe, setRememberMe] = useState(() => {
    return typeof window !== 'undefined' && localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  });
  const [email, setEmail] = useState(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(REMEMBER_ME_KEY) === 'true') {
      const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (saved) return saved;
    }
    return defaults.email;
  });
  const [password, setPassword] = useState(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(REMEMBER_ME_KEY) === 'true') {
      return '';
    }
    return defaults.password;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [googleBtnWidth, setGoogleBtnWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const estimated = window.innerWidth - 32;
      return Math.min(400, Math.max(200, Math.floor(estimated)));
    }
    return 400;
  });
  const googleContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = googleContainerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const width = el.clientWidth;
      if (width > 0) {
        const clamped = Math.min(400, Math.max(200, Math.floor(width)));
        setGoogleBtnWidth((prev) => (prev !== clamped ? clamped : prev));
      }
    };

    updateWidth();

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          const clamped = Math.min(400, Math.max(200, Math.floor(width)));
          setGoogleBtnWidth((prev) => (prev !== clamped ? clamped : prev));
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    // Purge any forbidden plaintext password
    localStorage.removeItem(OLD_REMEMBER_PASSWORD_KEY);

    const isRemembered = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    if (isRemembered) {
      const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (savedEmail) setEmail(savedEmail);
      setRememberMe(true);

      // Attempt to prefill password via Credential Management API (Chromium)
      if (typeof window !== 'undefined' && 'credentials' in navigator) {
        navigator.credentials
          .get({ password: true, mediation: 'optional' })
          .then((cred) => {
            const pwCred = cred as PasswordCredentialInstance | null;
            if (pwCred && pwCred.password) {
              setPassword(pwCred.password);
            }
          })
          .catch(() => {
            // Silently ignore if not supported or no credentials
          });
      }
    } else {
      if (import.meta.env.DEV) {
        const creds = QA_CREDENTIALS[type] ?? QA_CREDENTIALS.cliente;
        setEmail(creds.email);
        setPassword(creds.password);
      } else {
        setEmail('');
        setPassword('');
      }
      setRememberMe(false);
    }
    setError('');
  }, [type]);

  const buildUser = (realId: string | number, resolvedType: AppUserType, response: Record<string, unknown>): User => {
    if (resolvedType === 'cliente') {
      return { id: String(realId), nome: String(response.nome || 'Usuário'), email: String(response.email || email), tipo: 'cliente' };
    }
    if (resolvedType === 'profissional') {
      return { id: String(realId), nome: String(response.nome || 'Profissional'), email: String(response.email || email), tipo: 'profissional' } as User;
    }
    return {
      id: Number(realId),
      nome: String(response.nome || 'Estabelecimento'),
      email: String(response.email || email),
      endereco: '',
      imagem: '',
      avaliacao: 5,
      totalAvaliacoes: 0,
      horarioFuncionamento: '',
      tipo: 'estabelecimento',
    };
  };

  const handleAuthSuccess = (token: string, response: Record<string, unknown>) => {
    const realId = response.id || response.usuarioId || (response.user as Record<string, unknown>)?.id || getUserIdFromToken(token);
    if (!realId) throw new Error('Não foi possível identificar o usuário após o login.');

    const permissao = extractPermissaoFromAuthResponse(response);
    if (isMasterCredential(permissao, token)) {
      throw new Error(MASTER_LOGIN_BLOCKED_MESSAGE);
    }

    const actualUserType = resolveUserTypeFromAuth(token, permissao);

    if (type !== actualUserType) {
      toast.warning(
        `Esta conta é de ${typeLabels[actualUserType]}. Redirecionando para a área correta.`
      );
    }

    const mockUser = buildUser(realId as string | number, actualUserType, response);
    login(mockUser, token, actualUserType);

    toast.success(
      actualUserType === 'profissional'
        ? 'Bem-vindo, Profissional!'
        : actualUserType === 'estabelecimento'
          ? 'Bem-vindo de volta!'
          : 'Bem-vindo!'
    );
    navigate(getDashboardPath(actualUserType));
  };

  const handleSocialLogin = async (tokenPayload: Record<string, unknown>) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetchApi('/api/Login/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenPayload),
      });
      const token = response.token || response.Token || response.accessToken || (typeof response === 'string' ? response : '');
      if (!token) {
        console.error('Login social sem token no corpo da resposta:', response);
        throw new Error('Não foi possível concluir o login. Tente novamente em alguns instantes.');
      }
      handleAuthSuccess(token, response);
    } catch (err: unknown) {
      const errorMessage = getFriendlyErrorMessage(
        err,
        'Não foi possível entrar com Google. Tente novamente.',
      );
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetchApi('/api/Login/Acesso', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipToast: true,
      } as RequestInit);
      const token = response.token || response.Token || response.accessToken || (typeof response === 'string' ? response : '');
      if (!token) {
        console.error('Login sem token no corpo da resposta:', response);
        throw new Error('Não foi possível concluir o login. Tente novamente em alguns instantes.');
      }

      // Gerenciamento de credenciais e flag "Lembrar meu e-mail e senha"
      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, 'true');
        localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        if (typeof window !== 'undefined' && 'PasswordCredential' in window && 'credentials' in navigator) {
          try {
            await navigator.credentials.store(
              new PasswordCredential({ id: email, password, name: email })
            );
          } catch (credErr) {
            console.warn('Falha ao salvar credencial no gerenciador de senhas:', credErr);
          }
        }
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
      localStorage.removeItem(OLD_REMEMBER_PASSWORD_KEY);

      handleAuthSuccess(token, response);
    } catch (err: unknown) {
      // 400/401 aqui é recusa de credencial, não sessão expirada — a API nem sempre
      // manda corpo, então a tela precisa dar o texto certo.
      const errorMessage = getFriendlyErrorMessage(
        err,
        hasApiStatus(err, 400, 401)
          ? 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.'
          : 'Não foi possível entrar. Tente novamente em alguns instantes.',
      );
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Entrar</h1>
        <p className="mt-2 text-muted-foreground">
          Acesse sua conta como <span className="font-semibold text-foreground">{typeLabels[type]}</span>
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div ref={googleContainerRef} className="w-full flex justify-center">
          <GoogleLogin
            key={googleBtnWidth}
            onSuccess={(credentialResponse) => {
              if (credentialResponse.credential) {
                handleSocialLogin({ idToken: credentialResponse.credential });
              }
            }}
            onError={() => setError('Falha ao autenticar com o Google.')}
            type="standard"
            theme="outline"
            size="large"
            width={googleBtnWidth}
          />
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground">Ou continue com e-mail</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="email">E-mail</label>
          <Input
            id="email"
            name="username"
            type="email"
            placeholder="seu@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground" htmlFor="password">Senha</label>
            <Link to="#" className="text-sm text-primary hover:underline">
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            id="rememberMe"
            name="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-input text-primary focus:ring-primary accent-primary cursor-pointer"
          />
          <label
            htmlFor="rememberMe"
            className="text-sm text-muted-foreground select-none cursor-pointer"
          >
            Lembrar meu e-mail e senha
          </label>
        </div>

        {error && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full h-11" disabled={isLoading}>
          {isLoading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Não tem uma conta?{' '}
        <Link to={`/cadastro/${type}`} className="text-primary font-semibold hover:underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
