import { useState } from 'react';
import { fetchApi } from '@/lib/api';

const IS_DEMO_MODE = true; // TODO: Remover depois

export function useAgendamentoClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getEstabelecimentos = async () => {
    if (IS_DEMO_MODE) {
      return new Promise<any[]>((resolve) => {
        setTimeout(() => {
          resolve([
            {
              id: 1,
              nome: 'Barbearia Estilo',
              subtitulo: 'Barbearia Estilo Masculino',
              endereco: 'Rua das Flores, 123 - Centro',
              avaliacao: 4.5,
              totalAvaliacoes: 120,
              horario: 'Seg-Sex: 9h-19h | Sáb: 9h-17h',
              cor: 'bg-slate-900',
              textColor: 'text-white'
            },
            {
              id: 2,
              nome: 'Salao Beleza',
              subtitulo: 'Salão Beleza Total',
              endereco: 'Av. Principal, 456 - Jardim',
              avaliacao: 5.0,
              totalAvaliacoes: 89,
              horario: 'Seg-Sex: 8h-20h | Sáb: 8h-18h',
              cor: 'bg-slate-200',
              textColor: 'text-slate-900'
            },
            {
              id: 3,
              nome: 'Spa Premium',
              subtitulo: 'Spa & Estética Premium',
              endereco: 'Rua do Comércio, 789 - Vila Nova',
              avaliacao: 4.2,
              totalAvaliacoes: 65,
              horario: 'Seg-Sex: 9h-18h | Sáb: 9h-15h',
              cor: 'bg-slate-400',
              textColor: 'text-white'
            }
          ]);
        }, 500);
      });
    }

    try {
      setIsLoading(true);
      const data = await fetchApi('/api/Comercios');
      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getServicos = async (estabelecimentoId: number) => {
    if (IS_DEMO_MODE) {
      return new Promise<any[]>((resolve) => {
        setTimeout(() => {
          resolve([
            { id: 1, nome: 'Corte Masculino', duracao: '00:45:00', preco: 40.00 },
            { id: 2, nome: 'Barba Terapia', duracao: '00:30:00', preco: 35.00 },
            { id: 3, nome: 'Combo (Corte + Barba)', duracao: '01:15:00', preco: 70.00 },
          ]);
        }, 500);
      });
    }

    try {
      setIsLoading(true);
      const data = await fetchApi(`/api/Servicos/${estabelecimentoId}`);
      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getProfissionais = async (estabelecimentoId: number, servicoId: number) => {
    if (IS_DEMO_MODE) {
      return new Promise<any[]>((resolve) => {
        setTimeout(() => {
          resolve([
            { id: '1', nome: 'João da Silva' },
            { id: '2', nome: 'Pedro Costa' },
          ]);
        }, 500);
      });
    }

    try {
      setIsLoading(true);
      const data = await fetchApi(`/api/Comercios/Profissionais/${estabelecimentoId}`); // Note: The route is actually /Profissionais/{id} but fetchApi prefixes /api, wait, the controller has [HttpGet("/Profissionais/{id}")], so it's actually /Profissionais/{id} at the root. Let's use /api/Comercios/Profissionais if it was prefixed, but it's not. Wait, [HttpGet("/Profissionais/{id}")] overrides the controller route. So it's literally /Profissionais/{id}. But fetchApi might prepend the base URL. Let's just use /Profissionais/${estabelecimentoId}.
      // Wait, let's look at ComerciosController.cs: [HttpGet("/Profissionais/{id}")] means the route is literally /Profissionais/{id}.
      // I'll use `/Profissionais/${estabelecimentoId}`.
      const data2 = await fetchApi(`/Profissionais/${estabelecimentoId}`);
      return data2;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getDiasDisponiveis = async (comercioId: number, servicoId: number, profissionalId: string, mes: number, ano: number) => {
    if (IS_DEMO_MODE) {
      return new Promise<number[]>((resolve) => {
        setTimeout(() => {
          // Mock available days (e.g., 10, 12, 15, 20)
          resolve([10, 12, 15, 20, 22, 25]);
        }, 500);
      });
    }

    try {
      setIsLoading(true);
      const res = await fetchApi(`/api/Agenda/Agenda-Datas/?comercioId=${comercioId}&servicoId=${servicoId}&profissionalId=${profissionalId}&mes=${mes}&ano=${ano}`);
      return res || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getHorarios = async (comercioId: number, servicoId: number, profissionalId: string, dataEscolhida: string) => {
    if (IS_DEMO_MODE) {
      return new Promise<string[]>((resolve) => {
        setTimeout(() => {
          resolve(['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']);
        }, 500);
      });
    }

    try {
      setIsLoading(true);
      const res = await fetchApi(`/api/Agenda/Agenda-Horarios/?comercioId=${comercioId}&servicoId=${servicoId}&profissionalId=${profissionalId}&dataEscolhida=${dataEscolhida}`);
      return res.horariosDisponiveis || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const criarAgendamento = async (dados: any) => {
    if (IS_DEMO_MODE) {
      return new Promise<boolean>((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 1000);
      });
    }

    try {
      setIsLoading(true);
      await fetchApi('/api/Agenda', {
        method: 'POST',
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

  return {
    isLoading,
    error,
    getEstabelecimentos,
    getServicos,
    getProfissionais,
    getDiasDisponiveis,
    getHorarios,
    criarAgendamento
  };
}
