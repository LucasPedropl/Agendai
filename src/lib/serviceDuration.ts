export const MIN_SERVICE_DURATION_MINUTES = 1;
export const MAX_SERVICE_DURATION_MINUTES = 720;

/** "01:30:00" -> 90. Segundos arredondam para cima. Valor inválido ou vazio -> null. */
export function timeSpanToMinutes(timeSpan: string | null | undefined): number | null {
  if (!timeSpan || typeof timeSpan !== 'string') {
    return null;
  }

  const trimmed = timeSpan.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(?:(\d+)\.)?(\d+):(\d{1,2})(?::(\d{1,2}(?:\.\d+)?))?$/);
  if (!match) {
    return null;
  }

  const days = match[1] ? parseInt(match[1], 10) : 0;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3], 10);
  const seconds = match[4] ? parseFloat(match[4]) : 0;

  if (
    !Number.isFinite(days) ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    !Number.isFinite(seconds) ||
    days < 0 ||
    hours < 0 ||
    minutes < 0 ||
    seconds < 0
  ) {
    return null;
  }

  const roundedSecondsMinutes = seconds > 0 ? Math.ceil(seconds / 60) : 0;
  const total = days * 1440 + hours * 60 + minutes + roundedSecondsMinutes;

  return Number.isFinite(total) && total >= 0 ? total : null;
}

/** 90 -> "01:30:00". */
export function minutesToTimeSpan(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) {
    return '00:00:00';
  }

  const totalMinutes = Math.floor(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');

  return `${pad(hours)}:${pad(mins)}:00`;
}
