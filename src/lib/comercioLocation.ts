export interface ComercioLocation {
  /** Sem acento e em minúsculas: "Vitoria - ES" e "Vitória - ES" são a mesma cidade. */
  key: string;
  label: string;
}

const LOCATION_SEGMENT_REGEX = /^([^\d]+?)\s*[-/]\s*([A-Z]{2})$/;

function countAccents(str: string): number {
  const matches = str.normalize('NFD').match(/[\u0300-\u036f]/g);
  return matches ? matches.length : 0;
}

function normalizeKey(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractComercioLocation(endereco: string | null | undefined): ComercioLocation | null {
  if (!endereco || typeof endereco !== 'string') {
    return null;
  }

  const segments = endereco.split(',');
  let lastLocation: ComercioLocation | null = null;

  for (const rawSegment of segments) {
    const trimmed = rawSegment.trim();
    if (!trimmed) continue;

    const match = trimmed.match(LOCATION_SEGMENT_REGEX);
    if (!match) continue;

    const city = match[1].replace(/\s+/g, ' ').trim();
    const uf = match[2].trim();

    if (city.length < 2 || /\d/.test(city)) {
      continue;
    }

    const label = `${city} - ${uf}`;
    const key = normalizeKey(label);
    lastLocation = { key, label };
  }

  return lastLocation;
}

export function listComercioLocations(enderecos: Array<string | null | undefined>): ComercioLocation[] {
  const map = new Map<string, ComercioLocation>();

  for (const endereco of enderecos) {
    const location = extractComercioLocation(endereco);
    if (!location) continue;

    const existing = map.get(location.key);
    if (!existing) {
      map.set(location.key, location);
    } else if (countAccents(location.label) > countAccents(existing.label)) {
      map.set(location.key, location);
    }
  }

  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
}
