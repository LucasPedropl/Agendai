import { useState } from 'react';
import { fetchApi } from '@/lib/api';

const IS_DEMO_MODE = false; // TODO: Remover depois

export function useClientProfile() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPerfil = async (userId: string) => {
    if (IS_DEMO_MODE) {
      return new Promise<any>((resolve) => {
        setTimeout(() => {
          resolve({
            nome: 'João da Silva',
            email: 'joao@example.com',
            telefone: '(11) 98765-4321',
            dataNascimento: '1990-01-01'
          });
        }, 500);
      });
    }

    try {
      setIsLoading(true);
      const data = await fetchApi(`/api/Login/Dados-Usuario/${userId}`);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePerfil = async (userId: string, dados: any) => {
    if (IS_DEMO_MODE) {
      return new Promise<boolean>((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 500);
      });
    }

    try {
      setIsLoading(true);
      await fetchApi(`/api/Login/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(dados)
      });
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getConfig = async (userId: string) => {
    if (IS_DEMO_MODE) {
      return new Promise<any>((resolve) => {
        setTimeout(() => {
          resolve({
            notificaAgendamento: true,
            notificaPromo: false,
            notificaDiaAgendado: true
          });
        }, 500);
      });
    }

    try {
      setIsLoading(true);
      const data = await fetchApi(`/api/Login/Config-Usuario/${userId}`);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = async (userId: string, config: any) => {
    if (IS_DEMO_MODE) {
      return new Promise<boolean>((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 500);
      });
    }

    try {
      setIsLoading(true);
      await fetchApi(`/api/Login/Config-Usuario/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(config)
      });
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    getPerfil,
    updatePerfil,
    getConfig,
    updateConfig
  };
}
