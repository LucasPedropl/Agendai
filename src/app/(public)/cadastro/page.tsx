import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function CadastroPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const isCliente = type === 'cliente';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      navigate(`/login?type=${type}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
          <CardDescription>
            Cadastre-se como {isCliente ? 'Cliente' : 'Estabelecimento'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="nome">
                {isCliente ? 'Nome Completo' : 'Nome do Estabelecimento'}
              </label>
              <Input id="nome" required placeholder={isCliente ? 'João da Silva' : 'Barbearia do João'} />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="email">Email</label>
              <Input id="email" type="email" required placeholder="seu@email.com" />
            </div>

            {isCliente ? (
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="cpf">CPF</label>
                <Input id="cpf" required placeholder="000.000.000-00" />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="endereco">Endereço Completo</label>
                <Input id="endereco" required placeholder="Rua, Número, Bairro, Cidade" />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="password">Senha</label>
              <Input id="password" type="password" required />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center text-sm text-gray-500">
          <div>
            Já tem uma conta?{' '}
            <Link to={`/login?type=${type}`} className="text-indigo-600 hover:underline">
              Entrar
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
