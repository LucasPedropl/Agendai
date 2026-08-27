import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ADMIN_ACCESS_DENIED_MESSAGE } from '@/lib/apiHelpers';
import { queryKeys } from '@/lib/queryKeys';
import type { AcessoBixsRequestInput, AcessoBixsStatusQueryResult } from '../schemas';
import { acessoBixsService } from '../services/acessoBixsService';

/**
 * Limite conhecida: enquanto LoginController.cs não corrigir a role Admin no JWT,
 * getStatus e requestAccess podem retornar 403 em produção para donos de estabelecimento.
 */
export function useAcessoBixsStatus() {
  return useQuery<AcessoBixsStatusQueryResult, Error>({
    queryKey: queryKeys.acessoBixsStatus,
    queryFn: () => acessoBixsService.getStatus(),
    retry: false,
  });
}

export function useSendVerificationCodeMutation() {
  return useMutation({
    mutationFn: () => acessoBixsService.sendVerificationCode(),
  });
}

export function useRequestAcessoBixsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AcessoBixsRequestInput) => acessoBixsService.requestAccess(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.acessoBixsStatus });
    },
  });
}

export function getAcessoBixsErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Erro ao carregar integrações Bixs.';
}

export function getForbiddenMessage(): string {
  return ADMIN_ACCESS_DENIED_MESSAGE;
}
