import type { EstadoAcesso } from '../schemas';

export const ESTADO_ACESSO_LABEL: Record<EstadoAcesso, string> = {
  Ativo: 'Ativo',
  Inativo: 'Inativo',
  Solicitado: 'Aguardando liberação',
};

export function estadoBadgeVariant(
  estado: EstadoAcesso
): 'success' | 'warning' | 'danger' | 'neutral' {
  if (estado === 'Ativo') return 'success';
  if (estado === 'Solicitado') return 'warning';
  if (estado === 'Inativo') return 'danger';
  return 'neutral';
}

export function formatSolicitadoDate(isoDate: string): string {
  if (!isoDate.trim()) return '—';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsed);
}
