import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchApi } from '@/lib/api';
import { CheckCircle2, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { GoogleLogin } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';

export default function CadastroPage() {
  const { type, '*': splat } = useParams<{ type: string, '*': string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Try to get params from search params first, then from the "splat" (remainder of the path)
  const getParam = (name: string) => {
    const fromQuery = searchParams.get(name);
    if (fromQuery) return fromQuery;
    
    // If not in query, try to find in the splat (e.g., "comercioId=1&email=test@test.com")
    if (splat) {
      const pairs = splat.split('&');
      for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key === name) return decodeURIComponent(value);
      }
    }
    return '';
  };
  
  const initialEmail = getParam('email');
  const initialComercioId = getParam('comercioId');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login } = useAuth();
  
  const [step, setStep] = useState(initialEmail ? 1 : 1); // Start at step 1 anyway

  const isCliente = type === 'cliente';
  const isProfissional = type === 'profissional';
  const isEstabelecimento = type === 'estabelecimento';

  const getTipoPermissao = () => {
    if (isCliente) return 0;
    if (isProfissional) return 1;
    if (isEstabelecimento) return 2;
    return 0;
  };

  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    cpf: '',
    telefone: '',
    dataNascimento: '',
    email: initialEmail,
    comercioId: initialComercioId,
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (initialEmail) {
      setFormData(prev => ({ ...prev, email: initialEmail }));
    }
    if (initialComercioId) {
      setFormData(prev => ({ ...prev, comercioId: initialComercioId }));
    }
  }, [initialEmail, initialComercioId]);

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatTelefone = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length <= 10) {
      return v
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    }
    return v
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
    
    const today = new Date();
    const minAgeDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const randomPastDate = new Date(minAgeDate.getTime() - Math.random() * (10 * 365 * 24 * 60 * 60 * 1000));
    const formattedRandomDate = randomPastDate.toISOString().split('T')[0];

    const validCpf = generateValidCPF();
    const randomPhone = `279${Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('')}`;

    setFormData({
      ...formData,
      nome: `User${randomString}`,
      sobrenome: 'Test',
      cpf: formatCPF(validCpf),
      telefone: formatTelefone(randomPhone),
      dataNascimento: formattedRandomDate,
      email: formData.email || (isEstabelecimento ? 'jdncbdb2005@gmail.com' : `test_${randomString}@example.com`),
      password: '123123',
      confirmPassword: '123123'
    });
  };

  const handleNextStep = () => {
    setError('');
    // Basic validation before moving to next step
    if (step === 1 && (!formData.nome || !formData.sobrenome || !formData.cpf)) {
      setError('Preencha todos os campos para continuar.');
      return;
    }
    if (step === 2 && (!formData.telefone || !formData.dataNascimento)) {
      setError('Preencha todos os campos para continuar.');
      return;
    }
    if (step === 3 && (!formData.email || !formData.password || !formData.confirmPassword)) {
      if (formData.password !== formData.confirmPassword) {
        setError('As senhas não coincidem.');
        return;
      }
      // Se for o último passo, o form será submetido pelo onSubmit
      return;
    }
    
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setError('');
    setStep(prev => prev - 1);
  };

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
      
      const mockUser: User = type === 'cliente' 
        ? { id: '1', nome: response.nome || 'Usuário', email: response.email || '', tipo: 'cliente' }
        : { id: 1, nome: response.nome || 'Estabelecimento', email: response.email || '', endereco: '', imagem: '', avaliacao: 5, totalAvaliacoes: 0, horarioFuncionamento: '', tipo: 'estabelecimento' };
      
      login(mockUser, token, type as any);

      navigate(type === 'cliente' ? '/app' : '/estabelecimento/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || `Erro ao entrar com ${provider === 'google' ? 'Google' : 'Facebook'}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      let formattedDate = formData.dataNascimento;
      if (formattedDate) {
        const dateObj = new Date(formattedDate);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toISOString();
        }
      }

      const userPayload = {
        nome: formData.nome,
        sobrenome: formData.sobrenome,
        cpf: formData.cpf.replace(/\D/g, ''),
        telefone: formData.telefone.replace(/\D/g, ''),
        dataNascimento: formattedDate,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        tipoPermissao: getTipoPermissao(),
        comercioId: formData.comercioId ? parseInt(formData.comercioId) : 0
      };

      await fetchApi('/api/Login/Registrar', {
        method: 'POST',
        body: JSON.stringify(userPayload)
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

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="nome">Nome</label>
                <Input id="nome" required placeholder="Ex: João" value={formData.nome} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="sobrenome">Sobrenome</label>
                <Input id="sobrenome" required placeholder="Ex: Silva" value={formData.sobrenome} onChange={handleChange} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="cpf">CPF</label>
              <Input id="cpf" required placeholder="000.000.000-00" maxLength={14} value={formData.cpf} onChange={handleChange} />
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="telefone">Telefone</label>
              <Input id="telefone" required placeholder="(00) 00000-0000" maxLength={15} value={formData.telefone} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="dataNascimento">Data de Nascimento</label>
              <Input id="dataNascimento" type="date" required value={formData.dataNascimento} onChange={handleChange} />
            </div>
          </>
        );
      case 3:
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">Email</label>
              <Input id="email" type="email" required placeholder="exemplo@email.com" value={formData.email} onChange={handleChange} disabled={!!initialEmail} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">Senha</label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    placeholder="••••••••"
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
                <label className="text-sm font-medium" htmlFor="confirmPassword">Confirmar Senha</label>
                <div className="relative">
                  <Input 
                    id="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"} 
                    required 
                    placeholder="••••••••"
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
          </>
        );
      default:
        return null;
    }
  };

  const totalSteps = 3;
  const isLastStep = step === totalSteps;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Criar Conta</h1>
        <p className="text-gray-600">
          Cadastre-se como {isCliente ? 'Cliente' : isProfissional ? 'Profissional' : 'Estabelecimento'}
        </p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
          <span>Etapa {step} de {totalSteps}</span>
          <span>{Math.round((step / totalSteps) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(step / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={isLastStep ? handleRegister : (e) => { e.preventDefault(); handleNextStep(); }} className="space-y-6">
        
        {step === 1 && (
          <>
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
                  width="100%"
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
                <span className="bg-white px-2 text-gray-500">Ou continue com e-mail</span>
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          {renderStepContent()}
        </div>

        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={handlePrevStep} className="w-1/3">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          )}
          
          <Button type="submit" className={step > 1 ? "w-2/3" : "w-full"} disabled={isLoading}>
            {isLastStep ? (
              isLoading ? 'Cadastrando...' : 'Finalizar Cadastro'
            ) : (
              <>
                Avançar
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
        
        <Button 
          type="button" 
          variant="outline" 
          className="w-full border-dashed border-gray-400 text-gray-500 hover:text-gray-700" 
          onClick={handleFillRandomData}
        >
          Preencher Dados Aleatórios (Dev)
        </Button>
      </form>
      <div className="mt-6 text-center text-sm text-gray-500">
        Já tem uma conta?{' '}
        <Link to={`/login?type=${type}`} className="text-indigo-600 hover:underline">
          Entrar
        </Link>
      </div>
    </div>
  );
}
