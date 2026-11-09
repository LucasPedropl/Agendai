export interface Estabelecimento {
  id: number;
  nome: string;
  endereco: string;
  descricao?: string;
  logoUrl?: string | null;
  mediaAvalicoes?: number;
  totalAvalicoes?: number;
}

export interface Servico {
  id: number;
  comercioId?: number;
  nome: string;
  preco: number;
  duracao: string;
  descricao?: string;
  icone?: string | null;
  ativo?: boolean;
}

export interface Profissional {
  id: string | number;
  nome: string;
  status?: string;
}
