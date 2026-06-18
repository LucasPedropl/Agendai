import { useState } from 'react';
import { fetchApi } from '@/lib/api';
import { IS_CONFIG_USUARIO_PUT_BLOCKED } from '@/lib/apiHelpers';

export function useClientProfile() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtém os dados de perfil do usuário.
   */
  const getPerfil = async (userId: string) => {
    try {
      setIsLoading(true);
      // Rota correta identificada no Swagger: /api/Usuario/{id}
      const data = await fetchApi(`/api/Usuario/${userId}`);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Atualiza os dados de perfil do usuário.
   */
  const updatePerfil = async (userId: string, dados: any) => {
    try {
      setIsLoading(true);
      // Rota correta identificada no Swagger: /api/Usuario/{id}
      // O corpo deve seguir o schema EditarUsuario
      await fetchApi(`/api/Usuario/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          id: userId,
          nome: dados.nome,
          sobrenome: dados.sobrenome,
          cpf: dados.cpf,
          telefone: dados.telefone,
          dataNascimento: dados.dataNascimento,
          email: dados.email
        })
      });
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Obtém as configurações de notificação do usuário.
   */
  const getConfig = async (userId: string) => {
    try {
      setIsLoading(true);
      const data = await fetchApi(`/api/Usuario/Config-Usuario/${userId}`, {
        skipToast: true,
      } as RequestInit);
      return data;
    } catch {
      // API ainda espera int no path — retorna defaults até correção no backend
      return {
        usuarioId: userId,
        notificaAgendamento: true,
        notificaPromo: true,
        notificaDiaAgendado: true,
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Atualiza as configurações de notificação do usuário.
   */
  const updateConfig = async (userId: string, config: Record<string, unknown>) => {
    if (IS_CONFIG_USUARIO_PUT_BLOCKED) {
      setError('Salvar preferências de notificação temporariamente indisponível (correção pendente na API).');
      return false;
    }
    try {
      setIsLoading(true);
      await fetchApi(`/api/Usuario/Config-Usuario/${userId}`, {
        method: 'PUT',
        body: config,
        skipToast: true,
      } as RequestInit);
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
