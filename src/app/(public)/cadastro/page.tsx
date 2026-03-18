import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchApi } from '@/lib/api';

export default function CadastroPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isCliente = type === 'cliente';

  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    cpf: '',
    telefone: '',
    dataNascimento: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Formatar a data para o formato esperado pela API (ISO 8601)
      let formattedDate = formData.dataNascimento;
      if (formattedDate) {
        const dateObj = new Date(formattedDate);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toISOString();
        }
      }

      const payload = {
        ...formData,
        dataNascimento: formattedDate
      };

      await fetchApi('/api/Login/Registrar', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      navigate(`/login?type=${type}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao realizar cadastro. Verifique os dados e tente novamente.');
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
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="nome">Nome</label>
                <Input id="nome" required placeholder="João" value={formData.nome} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="sobrenome">Sobrenome</label>
                <Input id="sobrenome" required placeholder="Silva" value={formData.sobrenome} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="cpf">CPF</label>
              <Input id="cpf" required placeholder="00000000000" value={formData.cpf} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="telefone">Telefone</label>
                <Input id="telefone" required placeholder="27999999999" value={formData.telefone} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="dataNascimento">Data de Nasc.</label>
                <Input id="dataNascimento" type="date" required value={formData.dataNascimento} onChange={handleChange} />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="email">Email</label>
              <Input id="email" type="email" required placeholder="seu@email.com" value={formData.email} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="password">Senha</label>
                <Input id="password" type="password" required value={formData.password} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="confirmPassword">Confirmar Senha</label>
                <Input id="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} />
              </div>
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
