import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchApi } from '@/lib/api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function AtivarContaPage() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const ativarConta = async () => {
      if (!userId || !token) {
        setStatus('error');
        setErrorMessage('Link de ativação inválido ou incompleto.');
        return;
      }

      try {
        // A rota espera userId e token como query params
        await fetchApi(`/api/Login/Ativar-Login?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`, {
          method: 'POST',
        });
        
        setStatus('success');
      } catch (err: any) {
        console.error('Erro ao ativar conta:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Ocorreu um erro ao tentar ativar sua conta. O link pode ter expirado.');
      }
    };

    ativarConta();
  }, [userId, token]);

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
            {status === 'loading' && 'Ativando Conta...'}
            {status === 'success' && 'Conta Ativada!'}
            {status === 'error' && 'Erro na Ativação'}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {status === 'loading' && 'Por favor, aguarde enquanto verificamos suas informações.'}
            {status === 'success' && 'Seu email foi verificado com sucesso.'}
            {status === 'error' && errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'success' && (
            <p className="text-sm text-gray-600 mb-6">
              Sua conta já está pronta para uso. Você pode fazer login agora.
            </p>
          )}
          {status === 'error' && (
            <p className="text-sm text-gray-600 mb-6">
              Se você continuar tendo problemas, tente realizar o cadastro novamente ou entre em contato com o suporte.
            </p>
          )}
          
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/login-selection')} 
              className="w-full"
              disabled={status === 'loading'}
            >
              Ir para o Login
            </Button>
            
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
