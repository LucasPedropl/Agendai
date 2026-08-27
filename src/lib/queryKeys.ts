export const queryKeys = {
  adminComercios: ['admin', 'comercios'] as const,
  agendaComercio: (comercioId: number) => ['agenda', 'comercio', comercioId] as const,
  historicoComercio: (comercioId: number, periodo: string, status: string, profissional = '') =>
    ['agenda', 'historico', comercioId, periodo, status, profissional] as const,
  comercioUsuarios: (tipo: 'Clientes' | 'Profissionais', comercioId: number) =>
    ['comercio-usuarios', tipo, comercioId] as const,
  servicos: (comercioId: number) => ['servicos', comercioId] as const,
  categorias: (comercioId: number) => ['categorias', comercioId] as const,
  clienteAgendamentos: (userId: string) => ['cliente', 'agendamentos', userId] as const,
  clienteHistorico: (userId: string) => ['cliente', 'historico', userId] as const,
  clienteAvaliacoes: (userId: string) => ['cliente', 'avaliacoes', userId] as const,
  clientePagamentos: (userId: string) => ['cliente', 'pagamentos', userId] as const,
  clientePerfil: (userId: string) => ['cliente', 'perfil', userId] as const,
  clienteConfig: (userId: string) => ['cliente', 'config', userId] as const,
  comerciosPublicos: ['public', 'comercios'] as const,
  pagamentosEmpresa: (comercioId: number) => ['pagamentos', 'empresa', comercioId] as const,
  whatsappStatus: (comercioId: number) => ['whatsapp', 'status', comercioId] as const,
  acessoBixsStatus: ['acesso-bixs', 'status'] as const,
};
