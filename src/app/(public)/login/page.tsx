import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { fetchApi } from '@/lib/api';
import { Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';
import { useToast } from '@/contexts/ToastContext';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') as 'cliente' | 'estabelecimento' | 'profissional' || 'cliente';
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState(type === 'estabelecimento' ? 'jdncbdb2005@gmail.com' : '');
  const [password, setPassword] = useState(type === 'estabelecimento' ? '123123' : '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSocialLogin = async (provider: 'google' | 'facebook', tokenPayload: any) => {
    setIsLoading(true);
    setError('');

    try {
      const endpoint = provider === 'google' ? '/api/Login/google-login' : '/api/Login/facebook-login';
      const response = await fetchApi(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tokenPayload)
      });

      const token = response.token || response.accessToken || (typeof response === 'string' ? response : 'mock-jwt-token');
      
      const realId = response.id || response.usuarioId || response.user?.id || (type === 'cliente' ? '1' : 1);

      const mockUser: User = type === 'cliente' 
        ? { id: String(realId), nome: response.nome || 'Usuário', email: response.email || '', tipo: 'cliente' }
        : { id: Number(realId), nome: response.nome || 'Estabelecimento', email: response.email || '', endereco: '', imagem: '', avaliacao: 5, totalAvaliacoes: 0, horarioFuncionamento: '', tipo: 'estabelecimento' };
      
      login(mockUser, token, type as any);

      toast.success(`Autenticado com ${provider === 'google' ? 'Google' : 'Facebook'}!`);
      navigate(type === 'cliente' ? '/app' : '/estabelecimento/dashboard');
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || `Erro ao entrar com ${provider === 'google' ? 'Google' : 'Facebook'}. Por favor, tente novamente.`;
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
        skipToast: true
      } as any);

      // A API retorna o token e possivelmente os dados do usuário.
      // Vamos assumir que a resposta tem um formato { token: string, user: any } ou similar.
      // Se a API retornar apenas o token como string ou num objeto, adaptamos.
      const token = response.token || response.accessToken || (typeof response === 'string' ? response : 'mock-jwt-token');
      
      const realId = response.id || response.usuarioId || response.user?.id || (type === 'cliente' ? '1' : 1);

      const mockUser: User = type === 'cliente' 
        ? { id: String(realId), nome: response.nome || 'Usuário', email, tipo: 'cliente' }
        : { id: Number(realId), nome: response.nome || 'Estabelecimento', email, endereco: '', imagem: '', avaliacao: 5, totalAvaliacoes: 0, horarioFuncionamento: '', tipo: 'estabelecimento' };
      
      login(mockUser, token, type);

      toast.success('Bem-vindo de volta!');
      navigate(type === 'cliente' ? '/app' : '/estabelecimento/dashboard');
    } catch (err: any) {
      console.error(err);
      const errorMessage = 'E-mail ou senha incorretos. Você tem certeza que digitou os dados corretamente?';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Entrar</h1>
        <p className="text-gray-600">
          Acesse sua conta como {type === 'cliente' ? 'Cliente' : type === 'profissional' ? 'Profissional' : 'Estabelecimento'}
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 overflow-hidden rounded-md h-10 flex items-center justify-center border">
            <GoogleLogin
              onSuccess={credentialResponse => {
                handleSocialLogin('google', { idToken: credentialResponse.credential });
              }}
              onError={() => {
                setError('Falha ao autenticar com o Google.');
              }}
              type="standard"
              theme="outline"
              size="large"
            />
          </div>

          <FacebookLogin
            appId={import.meta.env.VITE_FACEBOOK_APP_ID || "123456789"}
            onSuccess={(response) => {
              handleSocialLogin('facebook', { accessToken: response.accessToken });
            }}
            onFail={(error) => {
              console.error('Facebook Login Error:', error);
              setError('Falha ao autenticar com o Facebook.');
            }}
            onProfileSuccess={(response) => {
              console.log('Get Profile Success!', response);
            }}
            render={({ onClick }) => (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClick}
                disabled
                className="flex-1 flex items-center justify-center gap-2 hover:bg-blue-50 hover:text-blue-600 transition-all h-10 opacity-50 cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z"></path>
                </svg>
                Facebook
              </Button>
            )}
          />
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Ou continue com</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">Email</label>
          <Input 
            id="email" 
            type="email" 
            placeholder="exemplo@email.com" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" htmlFor="password">Senha</label>
            <Link to="#" className="text-sm text-indigo-600 hover:underline">
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <Input 
              id="password" 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••"
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              type="button" 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
      <div className="mt-4 text-center text-sm text-gray-500">
        Não tem uma conta?{' '}
        <Link to={`/cadastro/${type}`} className="text-indigo-600 hover:underline">
          Cadastre-se
        </Link>
      </div>
    </div>
  );
}
