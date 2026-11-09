import { isBefore, isSameDay, startOfDay } from 'date-fns';

export interface ProfessionalSlots {
  professionalId: string;
  times: string[];
}

export interface MergedSlots {
  times: string[];
  professionalByTime: Record<string, string>;
}

export function mergeProfessionalSlots(slots: ProfessionalSlots[]): MergedSlots {
  const professionalByTime: Record<string, string> = {};

  for (const slot of slots) {
    const { professionalId, times } = slot;
    if (!professionalId || !Array.isArray(times)) continue;

    for (const time of times) {
      const trimmedTime = typeof time === 'string' ? time.trim() : '';
      if (!trimmedTime) continue;

      if (!(trimmedTime in professionalByTime)) {
        professionalByTime[trimmedTime] = professionalId;
      }
    }
  }

  const times = Object.keys(professionalByTime).sort((a, b) => a.localeCompare(b));

  return {
    times,
    professionalByTime,
  };
}

export function parseSlotTime(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return { hours, minutes };
}

/**
 * Retorna true se a data for anterior a hoje OU se for hoje e o horário já tiver passado no horário local do usuário.
 */
export function isSlotInPast(date: Date, timeStr: string, now: Date = new Date()): boolean {
  if (isBefore(startOfDay(date), startOfDay(now))) {
    return true;
  }
  if (!isSameDay(date, now)) {
    return false;
  }
  const parsed = parseSlotTime(timeStr);
  if (!parsed) return false;
  const slotDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), parsed.hours, parsed.minutes, 0, 0);
  return slotDate.getTime() <= now.getTime();
}
