import { useState, useCallback } from 'react';
import { fetchApi } from '@/lib/api';
import { getFriendlyErrorMessage } from '@/lib/errors';

export interface Pagamento {
  id: number;
  agendamentoId: number;
  valor: number;
  dataPagamento: string | null;
  dataCriacao: string;
  descricao: string | null;
  statusPagamento: number;
  metodoPagamento: number;
}

export function useFinance() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPagamentosCliente = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchApi('/api/Pagamentos/Pagamentos-Cliente');
      return Array.isArray(data) ? data : [];
    } catch (err: unknown) {
      setError(getFriendlyErrorMessage(err, 'Não foi possível carregar seus pagamentos.'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPagamentosEmpresa = useCallback(async (comercioId: number) => {
    setIsLoading(true);
    try {
      const data = await fetchApi(`/api/Pagamentos/Pagamentos-Empresa/${comercioId}`, {
        skipToast: true,
      } as RequestInit);
      return Array.isArray(data) ? data : [];
    } catch (err: unknown) {
      setError(getFriendlyErrorMessage(err, 'Não foi possível carregar os pagamentos do estabelecimento.'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    getPagamentosCliente,
    getPagamentosEmpresa,
  };
}
