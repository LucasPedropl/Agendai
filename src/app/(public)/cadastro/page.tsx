import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchApi } from '@/lib/api';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function CadastroPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatTelefone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (e.target.id === 'cpf') {
      value = formatCPF(value);
    } else if (e.target.id === 'telefone') {
      value = formatTelefone(value);
    }
    setFormData({ ...formData, [e.target.id]: value });
  };

  const generateValidCPF = () => {
    const randomDigit = () => Math.floor(Math.random() * 10);
    const n = Array.from({ length: 9 }, randomDigit);

    let d1 = n.reduce((total, number, index) => total + number * (10 - index), 0);
    d1 = 11 - (d1 % 11);
    if (d1 >= 10) d1 = 0;

    let d2 = n.reduce((total, number, index) => total + number * (11 - index), 0) + d1 * 2;
    d2 = 11 - (d2 % 11);
    if (d2 >= 10) d2 = 0;

    return [...n, d1, d2].join('');
  };

  const handleFillRandomData = () => {
    const randomString = Math.random().toString(36).substring(2, 8);
    
    // Generate a random date that makes the user at least 18 years old
    const today = new Date();
    const minAgeDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const randomPastDate = new Date(minAgeDate.getTime() - Math.random() * (10 * 365 * 24 * 60 * 60 * 1000)); // Up to 10 years older than 18
    const formattedRandomDate = randomPastDate.toISOString().split('T')[0];

    const validCpf = generateValidCPF();
    
    // Generate a random 11-digit phone number
    const randomPhone = `279${Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('')}`;

    setFormData({
      nome: `User${randomString}`,
      sobrenome: 'Test',
      cpf: formatCPF(validCpf),
      telefone: formatTelefone(randomPhone),
      dataNascimento: formattedRandomDate,
      email: `test_${randomString}@example.com`,
      password: '123123',
      confirmPassword: '123123'
    });
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
        cpf: formData.cpf.replace(/\D/g, ''),
        telefone: formData.telefone.replace(/\D/g, ''),
        dataNascimento: formattedDate
      };

      await fetchApi('/api/Login/Registrar', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao realizar cadastro. Verifique os dados e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Cadastro Realizado!</CardTitle>
            <CardDescription className="text-base mt-2">
              Enviamos um email de confirmação para <strong>{formData.email}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-6">
              Por favor, verifique sua caixa de entrada e clique no link enviado para ativar sua conta.
              Você só poderá fazer login após a ativação.
            </p>
            <Button onClick={() => navigate(`/login?type=${type}`)} className="w-full">
              Ir para o Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={formData.password} 
                    onChange={handleChange} 
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
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="confirmPassword">Confirmar Senha</label>
                <div className="relative">
                  <Input 
                    id="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"} 
                    required 
                    value={formData.confirmPassword} 
                    onChange={handleChange} 
                  />
                  <button 
                    type="button" 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
            
            {/* DEVELOPMENT ONLY: Remove this button before production */}
            {import.meta.env.DEV && (
              <Button 
                type="button" 
                variant="outline" 
                className="w-full border-dashed border-gray-400 text-gray-500 hover:text-gray-700" 
                onClick={handleFillRandomData}
              >
                Preencher Dados Aleatórios (Dev)
              </Button>
            )}
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
