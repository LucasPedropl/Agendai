import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import type { ChavePixFormInput, ChavePixUpdateInput, ChavesPixQueryResult } from '../schemas';
import { chavesPixService } from '../services/chavesPixService';

export function useChavesPix() {
  return useQuery<ChavesPixQueryResult, Error>({
    queryKey: queryKeys.chavesPix,
    queryFn: () => chavesPixService.list(),
    retry: false,
  });
}

function useInvalidateChavesPix() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.chavesPix });
  };
}

export function useCreateChavePixMutation() {
  const invalidate = useInvalidateChavesPix();

  return useMutation({
    mutationFn: (input: ChavePixFormInput) => chavesPixService.create(input),
    onSuccess: invalidate,
    // A reativação chega como erro (ver ChavePixReactivatedError), mas mudou o
    // servidor — sem invalidar aqui a lista ficaria mostrando a chave inativa.
    onError: invalidate,
  });
}

export function useUpdateChavePixMutation() {
  const invalidate = useInvalidateChavesPix();

  return useMutation({
    mutationFn: (input: ChavePixUpdateInput) => chavesPixService.update(input),
    onSuccess: invalidate,
  });
}

export function useDeactivateChavePixMutation() {
  const invalidate = useInvalidateChavesPix();

  return useMutation({
    mutationFn: (idChavePix: number) => chavesPixService.deactivate(idChavePix),
    onSuccess: invalidate,
  });
}

export function getChavesPixErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Erro ao carregar chaves PIX.';
}
