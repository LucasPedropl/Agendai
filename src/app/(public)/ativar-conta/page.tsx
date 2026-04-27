import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchApi } from '@/lib/api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';

export default function AtivarContaPage() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  // URLSearchParams converte '+' em ' ' (espaço). Como tokens Base64 não têm espaços, 
  // mas podem ter '+', precisamos reverter essa conversão para evitar falhas na API.
  const rawToken = searchParams.get('token');
  const token = rawToken ? rawToken.replace(/ /g, '+') : null;
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [redirectPath, setRedirectPath] = useState('');

  useEffect(() => {
    const ativarConta = async () => {
      if (!userId || !token) {
        setStatus('error');
        setErrorMessage('Link de ativação inválido ou incompleto.');
        return;
      }

      try {
        // A rota espera userId e token como query params
        const response: any = await fetchApi(`/api/Login/Ativar-Login?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`, {
          method: 'POST',
        });
        
        if (response && response.token) {
          const isCliente = response.permissao === 'Cliente';
          const userType = isCliente ? 'cliente' : 'estabelecimento';
          
          const mockUser: User = isCliente 
            ? { id: userId, nome: 'Usuário', email: '', tipo: 'cliente' }
            : { id: 1, nome: 'Estabelecimento', email: '', endereco: '', imagem: '', avaliacao: 5, totalAvaliacoes: 0, horarioFuncionamento: '', tipo: 'estabelecimento' };
          
          login(mockUser, response.token, userType);
          setRedirectPath(isCliente ? '/app' : '/estabelecimento/dashboard');
        }

        setStatus('success');
      } catch (err: any) {
        console.error('Erro ao ativar conta:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Ocorreu um erro ao tentar ativar sua conta. O link pode ter expirado.');
      }
    };

    ativarConta();
  }, [userId, token, login]);

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            {status === 'loading' && <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />}
            {status === 'success' && <CheckCircle2 className="h-8 w-8 text-green-600" />}
            {status === 'error' && <XCircle className="h-8 w-8 text-red-600" />}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Ativando e Acessando Conta...'}
            {status === 'success' && 'Conta Ativada e Conectada!'}
            {status === 'error' && 'Erro na Ativação'}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {status === 'loading' && 'Por favor, aguarde enquanto verificamos suas informações e conectamos você.'}
            {status === 'success' && 'Seu login foi realizado com sucesso.'}
            {status === 'error' && errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'success' && (
            <p className="text-sm text-gray-600 mb-6">
              Sua conta já está pronta para uso. O redirecionamento será automático ou clique no botão abaixo.
            </p>
          )}
          {status === 'error' && (
            <p className="text-sm text-gray-600 mb-6">
              Se você continuar tendo problemas, tente realizar o cadastro novamente ou entre em contato com o suporte.
            </p>
          )}
          
          <div className="space-y-3">
            {status === 'success' ? (
              <Button 
                onClick={() => navigate(redirectPath)} 
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Acessar meu painel
              </Button>
            ) : (
              <Button 
                onClick={() => navigate('/login-selection')} 
                className="w-full"
                disabled={status === 'loading'}
              >
                Ir para o Login
              </Button>
            )}
            
            {status === 'error' && (
              <Button 
                variant="outline" 
                onClick={() => navigate('/login-selection')} 
                className="w-full"
              >
                Voltar ao Início
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
