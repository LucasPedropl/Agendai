import { useState } from 'react';
import { fetchApi } from '@/lib/api';

const IS_DEMO_MODE = false; // TODO: Remover depois

export function useClientDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAgendamentos = async (userId: string) => {
    if (IS_DEMO_MODE) {
      return new Promise<any[]>((resolve) => {
        setTimeout(() => {
          resolve([
            {
              id: 1,
              dataAgendamento: new Date(Date.now() + 86400000).toISOString(),
              servicoNome: 'Corte Masculino',
              profissionalNome: 'João da Silva',
              status: 'Confirmado'
            },
            {
              id: 2,
              dataAgendamento: new Date(Date.now() + 172800000).toISOString(),
              servicoNome: 'Barba Terapia',
              profissionalNome: 'Pedro Costa',
              status: 'Pendente'
            }
          ]);
        }, 500);
      });
    }

    try {
      setIsLoading(true);
      const data = await fetchApi(`/api/Agenda/Cliente/${userId}`);
      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getHistorico = async (userId: string) => {
    if (IS_DEMO_MODE) {
      return new Promise<any[]>((resolve) => {
        setTimeout(() => {
          resolve([
            {
              dataAgendamento: new Date(Date.now() - 86400000).toISOString(),
              servicoNome: 'Corte Masculino',
              status: 'Concluído',
              valor: 40.00
            },
            {
              dataAgendamento: new Date(Date.now() - 172800000).toISOString(),
              servicoNome: 'Combo (Corte + Barba)',
              status: 'Cancelado',
              valor: 70.00
            }
          ]);
        }, 500);
      });
    }

    try {
      setIsLoading(true);
      const data = await fetchApi(`/api/Agenda/Cliente-Historico/${userId}`);
      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getAvaliacoes = async (userId: string) => {
    if (IS_DEMO_MODE) {
      return new Promise<any[]>((resolve) => {
        setTimeout(() => {
          resolve([
            {
              id: 1,
              servico: 'Corte Masculino',
              profissional: 'João da Silva',
              dataServico: new Date(Date.now() - 86400000).toISOString(),
              nota: 5,
              comentario: 'Ótimo atendimento, profissional muito atencioso!',
            },
            {
              id: 2,
              servico: 'Barba Terapia',
              profissional: 'Pedro Costa',
              dataServico: new Date(Date.now() - 172800000).toISOString(),
              nota: 4,
              comentario: 'Gostei bastante, mas atrasou um pouco.',
            },
          ]);
        }, 500);
      });
    }

    try {
      setIsLoading(true);
      const data = await fetchApi(`/api/Avaliacoes/Usuario/${userId}`);
      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    getAgendamentos,
    getHistorico,
    getAvaliacoes
  };
}
