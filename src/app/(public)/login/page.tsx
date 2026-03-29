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
  const type = searchParams.get('type') as 'cliente' | 'estabelecimento' || 'cliente';
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      
      // Criar um usuário mockado baseado no tipo para manter a compatibilidade com o AuthContext
      // Idealmente, a API deve retornar os dados do usuário ou devemos buscar em /api/Usuario/Me
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
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
          <CardDescription>
            Acesse sua conta como {type === 'cliente' ? 'Cliente' : 'Estabelecimento'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                Email
              </label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                  Senha
                </label>
                <Link to="#" className="text-sm text-indigo-600 hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
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
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center text-sm text-gray-500">
          <div>
            Não tem uma conta?{' '}
            <Link to={`/cadastro/${type}`} className="text-indigo-600 hover:underline">
              Cadastre-se
            </Link>
          </div>
          <Link to="/login-selection" className="text-gray-400 hover:text-gray-600">
            Voltar para seleção de perfil
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
