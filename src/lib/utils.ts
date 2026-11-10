import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Formata um valor em reais no padrão brasileiro (R$ 1.234,56). */
export function formatBRL(value: number): string {
  return brlFormatter.format(Number.isFinite(value) ? value : 0);
}

/**
 * Rótulo do item de menu ativo: escolhe o caminho mais específico, para que
 * `/app` não "ganhe" de `/app/agendamentos`.
 */
export function findActiveNavLabel(
  pathname: string,
  items: ReadonlyArray<{ to: string; label: string }>,
  fallback: string,
): string {
  const matches = items.filter(
    (item) => pathname === item.to || pathname.startsWith(`${item.to}/`),
  );
  if (matches.length === 0) return fallback;
  return matches.reduce((best, item) => (item.to.length > best.to.length ? item : best)).label;
}
