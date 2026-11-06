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
