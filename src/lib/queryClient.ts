import { QueryClient } from '@tanstack/react-query';

/** Cliente global — dados sempre refetch ao entrar na página; cache evita flash entre rotas. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 5 * 60 * 1000,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
