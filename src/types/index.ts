export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  userType: 'cliente' | 'estabelecimento' | null;
}

export type User = Cliente | Estabelecimento;

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  data_nascimento?: string;
  tipo: 'cliente';
  totalAgendamentos?: number;
  ultimoAgendamento?: string;
}

export interface Estabelecimento {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  endereco: string;
  imagem: string;
  avaliacao: number;
  totalAvaliacoes: number;
  horarioFuncionamento: string;
  tipo: 'estabelecimento';
}

export interface Agendamento {
  id: string;
  servico: string;
  profissional: string;
  data: string;
  horario: string;
  usuarioId?: string;
  estabelecimentoId?: number;
  preco: string;
  status: 'confirmado' | 'pendente' | 'cancelado' | 'concluido';
  estabelecimento?: string;
}

export interface Servico {
  id: string;
  nome: string;
  duracao: string;
  preco: string;
  descricao?: string;
  estabelecimentoId?: number;
  categoria?: string;
  icone?: string;
  ativo?: boolean;
}

export interface Profissional {
  id: string;
  nome: string;
  telefone?: string;
  especialidades?: string[];
  estabelecimentoId?: number;
  email?: string;
  ativo?: boolean;
}

export interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  status: 'pago' | 'pendente' | 'cancelado';
  servico?: string;
}
