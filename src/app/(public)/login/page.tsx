import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { fetchApi } from '@/lib/api';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') as 'cliente' | 'estabelecimento' | 'profissional' || 'cliente';
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState(type === 'estabelecimento' ? 'jdncbdb2005@gmail.com' : '');
  const [password, setPassword] = useState(type === 'estabelecimento' ? '123123' : '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetchApi('/api/Login/Acesso', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      // A API retorna o token e possivelmente os dados do usuário.
      // Vamos assumir que a resposta tem um formato { token: string, user: any } ou similar.
      // Se a API retornar apenas o token como string ou num objeto, adaptamos.
      const token = response.token || response.accessToken || (typeof response === 'string' ? response : 'mock-jwt-token');
      
      const mockUser: User = type === 'cliente' 
        ? { id: '1', nome: response.nome || 'Usuário', email, tipo: 'cliente' }
        : { id: 1, nome: response.nome || 'Estabelecimento', email, endereco: '', imagem: '', avaliacao: 5, totalAvaliacoes: 0, horarioFuncionamento: '', tipo: 'estabelecimento' };
      
      login(mockUser, token, type);

      navigate(type === 'cliente' ? '/app' : '/estabelecimento/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Credenciais inválidas ou erro no servidor.');
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
        <Button 
          type="button" 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-gray-400 hover:cursor-not-allowed transition-all"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
            </g>
          </svg>
          Entrar com Google
        </Button>
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
