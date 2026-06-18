import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { fetchApi } from '@/lib/api';
import { getUserIdFromToken, resolveUserTypeFromAuth, getDashboardPath, type AppUserType } from '@/lib/apiHelpers';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';
import { useToast } from '@/contexts/ToastContext';

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

  const defaults = QA_CREDENTIALS[type] ?? QA_CREDENTIALS.cliente;
  const [email, setEmail] = useState(defaults.email);
  const [password, setPassword] = useState(defaults.password);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const creds = QA_CREDENTIALS[type] ?? QA_CREDENTIALS.cliente;
    setEmail(creds.email);
    setPassword(creds.password);
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

    const actualUserType = resolveUserTypeFromAuth(
      token,
      typeof response.permissao === 'string' ? response.permissao : null
    );

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

  const handleSocialLogin = async (provider: 'google' | 'facebook', tokenPayload: Record<string, unknown>) => {
    setIsLoading(true);
    setError('');
    try {
      const endpoint = provider === 'google' ? '/api/Login/google-login' : '/api/Login/facebook-login';
      const response = await fetchApi(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenPayload),
      });
      const token = response.token || response.Token || response.accessToken || (typeof response === 'string' ? response : '');
      if (!token) throw new Error('Token não retornado pela API');
      handleAuthSuccess(token, response);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : `Erro ao entrar com ${provider === 'google' ? 'Google' : 'Facebook'}.`;
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
      if (!token) throw new Error('Token não retornado pela API');
      handleAuthSuccess(token, response);
    } catch {
      const errorMessage = 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.';
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
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 overflow-hidden rounded-xl h-10 flex items-center justify-center border border-border">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                handleSocialLogin('google', { idToken: credentialResponse.credential });
              }}
              onError={() => setError('Falha ao autenticar com o Google.')}
              type="standard"
              theme="outline"
              size="large"
            />
          </div>
          <FacebookLogin
            appId={import.meta.env.VITE_FACEBOOK_APP_ID || '123456789'}
            onSuccess={(response) => handleSocialLogin('facebook', { accessToken: response.accessToken })}
            onFail={(fbError) => {
              console.error('Facebook Login Error:', fbError);
              setError('Falha ao autenticar com o Facebook.');
            }}
            onProfileSuccess={() => {}}
            render={({ onClick }) => (
              <Button
                type="button"
                variant="outline"
                onClick={onClick}
                disabled
                className="flex-1 h-10 opacity-50 cursor-not-allowed"
              >
                Facebook
              </Button>
            )}
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
            type="email"
            placeholder="seu@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
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
