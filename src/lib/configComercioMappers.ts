import { toApiTimeSpan } from '@/lib/apiHelpers';

export interface HorarioAtendimento {
  dias: number[];
  horaInicio: string;
  horaFim: string;
  intervalo: boolean;
  inicioIntervalo?: string;
  fimIntervalo?: string;
}

export interface DiaFechado {
  id?: number;
  data: string;
  descricao?: string;
}

export interface ConfigComercio {
  comercioId: number;
  antecedenciaMin: number;
  limiteAgendar: number;
  confirmaAuto: boolean;
  tempoDuracaoPadrao: number;
  tempoCancelamento: number;
  reagendar: boolean;
  tempoIntervalo: number;
  agendaSimultanea: number;
  horarioPorProfissional: boolean;
  fechaFeriadosNacionais: boolean;
  fechaFeriadosMunicipais: boolean;
  diasFechados: DiaFechado[];
}

export interface ComercioConfigFuncionario {
  idFuncionario: string;
  nomeFuncionario?: string;
  idHorarioAtendimento?: number;
  dias: number[];
  horaInicio: string;
  horaFim: string;
  inicioIntervalo?: string;
  fimIntervalo?: string;
  intervalo: boolean;
}

export interface ComercioConfiguracao {
  idHorarioAtendimento?: number;
  idConfigComercio?: number;
  horarioAtendimento?: HorarioAtendimento;
  configuracao?: ConfigComercio;
  funcionarios?: ComercioConfigFuncionario[];
}

function readRecord(data: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in data) return data[key];
  }
  return undefined;
}

function mapHorario(raw: unknown): HorarioAtendimento | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const h = raw as Record<string, unknown>;
  const dias = readRecord(h, 'dias', 'Dias');
  return {
    dias: Array.isArray(dias) ? (dias as number[]) : [1, 2, 3, 4, 5],
    horaInicio: String(readRecord(h, 'horaInicio', 'HoraInicio') ?? '08:00:00'),
    horaFim: String(readRecord(h, 'horaFim', 'HoraFim') ?? '18:00:00'),
    intervalo: Boolean(readRecord(h, 'intervalo', 'Intervalo')),
    inicioIntervalo: readRecord(h, 'inicioIntervalo', 'InicioIntervalo') as string | undefined,
    fimIntervalo: readRecord(h, 'fimIntervalo', 'FimIntervalo') as string | undefined,
  };
}

function mapDiaFechado(raw: unknown): DiaFechado | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  const data = readRecord(d, 'data', 'Data');
  if (!data) return null;
  return {
    id: readRecord(d, 'id', 'Id') as number | undefined,
    data: String(data),
    descricao: (readRecord(d, 'descricao', 'Descricao') as string | undefined) ?? undefined,
  };
}

function mapConfiguracao(raw: unknown, comercioId: number): ConfigComercio {
  const defaults = createDefaultConfiguracao(comercioId);
  if (!raw || typeof raw !== 'object') return defaults;
  const c = raw as Record<string, unknown>;
  const diasRaw = readRecord(c, 'diasFechados', 'DiasFechados');
  const diasFechados = Array.isArray(diasRaw)
    ? diasRaw.map(mapDiaFechado).filter((d): d is DiaFechado => d !== null)
    : defaults.diasFechados;

  return {
    comercioId: Number(readRecord(c, 'comercioId', 'ComercioId') ?? comercioId),
    antecedenciaMin: Number(readRecord(c, 'antecedenciaMin', 'AntecedenciaMin') ?? defaults.antecedenciaMin),
    limiteAgendar: Number(readRecord(c, 'limiteAgendar', 'LimiteAgendar') ?? defaults.limiteAgendar),
    confirmaAuto: Boolean(readRecord(c, 'confirmaAuto', 'ConfirmaAuto') ?? defaults.confirmaAuto),
    tempoDuracaoPadrao: Number(readRecord(c, 'tempoDuracaoPadrao', 'TempoDuracaoPadrao') ?? defaults.tempoDuracaoPadrao),
    tempoCancelamento: Number(readRecord(c, 'tempoCancelamento', 'TempoCancelamento') ?? defaults.tempoCancelamento),
    reagendar: Boolean(readRecord(c, 'reagendar', 'Reagendar') ?? defaults.reagendar),
    tempoIntervalo: Number(readRecord(c, 'tempoIntervalo', 'TempoIntervalo') ?? defaults.tempoIntervalo),
    agendaSimultanea: Number(readRecord(c, 'agendaSimultanea', 'AgendaSimultanea') ?? defaults.agendaSimultanea),
    horarioPorProfissional: Boolean(readRecord(c, 'horarioPorProfissional', 'HorarioPorProfissional') ?? defaults.horarioPorProfissional),
    fechaFeriadosNacionais: Boolean(readRecord(c, 'fechaFeriadosNacionais', 'FechaFeriadosNacionais') ?? defaults.fechaFeriadosNacionais),
    fechaFeriadosMunicipais: Boolean(readRecord(c, 'fechaFeriadosMunicipais', 'FechaFeriadosMunicipais') ?? defaults.fechaFeriadosMunicipais),
    diasFechados,
  };
}

function mapFuncionario(raw: unknown): ComercioConfigFuncionario | null {
  if (!raw || typeof raw !== 'object') return null;
  const f = raw as Record<string, unknown>;
  const idFuncionario = readRecord(f, 'idFuncionario', 'IdFuncionario');
  if (!idFuncionario) return null;
  const dias = readRecord(f, 'dias', 'Dias');
  return {
    idFuncionario: String(idFuncionario),
    nomeFuncionario: readRecord(f, 'nomeFuncionario', 'NomeFuncionario') as string | undefined,
    dias: Array.isArray(dias) ? (dias as number[]) : [],
    horaInicio: String(readRecord(f, 'horaInicio', 'HoraInicio') ?? '08:00:00'),
    horaFim: String(readRecord(f, 'horaFim', 'HoraFim') ?? '18:00:00'),
    intervalo: Boolean(readRecord(f, 'intervalo', 'Intervalo')),
    inicioIntervalo: readRecord(f, 'inicioIntervalo', 'InicioIntervalo') as string | undefined,
    fimIntervalo: readRecord(f, 'fimIntervalo', 'FimIntervalo') as string | undefined,
  };
}

export function createDefaultConfiguracao(comercioId: number): ConfigComercio {
  return {
    comercioId,
    antecedenciaMin: 1,
    limiteAgendar: 30,
    confirmaAuto: true,
    tempoDuracaoPadrao: 30,
    tempoCancelamento: 24,
    reagendar: true,
    tempoIntervalo: 0,
    agendaSimultanea: 1,
    horarioPorProfissional: false,
    fechaFeriadosNacionais: false,
    fechaFeriadosMunicipais: false,
    diasFechados: [],
  };
}

export function createDefaultConfig(comercioId: number): ComercioConfiguracao {
  return {
    horarioAtendimento: {
      dias: [1, 2, 3, 4, 5],
      horaInicio: '08:00:00',
      horaFim: '18:00:00',
      intervalo: false,
    },
    configuracao: createDefaultConfiguracao(comercioId),
    funcionarios: [],
  };
}

const CONFIG_IDS_CACHE_PREFIX = 'agendai_config_ids_';

export function hasValidConfigIds(config: ComercioConfiguracao): boolean {
  return (config.idConfigComercio ?? 0) > 0 && (config.idHorarioAtendimento ?? 0) > 0;
}

export function getCachedConfigIds(
  comercioId: number
): Pick<ComercioConfiguracao, 'idConfigComercio' | 'idHorarioAtendimento'> | null {
  try {
    const raw = localStorage.getItem(`${CONFIG_IDS_CACHE_PREFIX}${comercioId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      idConfigComercio?: number;
      idHorarioAtendimento?: number;
    };
    if ((parsed.idConfigComercio ?? 0) > 0 && (parsed.idHorarioAtendimento ?? 0) > 0) {
      return {
        idConfigComercio: parsed.idConfigComercio,
        idHorarioAtendimento: parsed.idHorarioAtendimento,
      };
    }
  } catch {
    // ignore cache parse errors
  }
  return null;
}

export function setCachedConfigIds(
  comercioId: number,
  ids: Pick<ComercioConfiguracao, 'idConfigComercio' | 'idHorarioAtendimento'>
): void {
  localStorage.setItem(`${CONFIG_IDS_CACHE_PREFIX}${comercioId}`, JSON.stringify(ids));
}

/** Mescla IDs válidos do GET ou do cache local (sem heurística). */
export function mergeConfigIdsFromCache(
  config: ComercioConfiguracao,
  comercioId: number
): ComercioConfiguracao {
  if (hasValidConfigIds(config)) {
    setCachedConfigIds(comercioId, {
      idConfigComercio: config.idConfigComercio,
      idHorarioAtendimento: config.idHorarioAtendimento,
    });
    return config;
  }

  const cached = getCachedConfigIds(comercioId);
  if (cached) {
    return { ...config, ...cached };
  }

  return config;
}

export function buildConfigIdCandidates(comercioId: number): Array<{
  idConfigComercio: number;
  idHorarioAtendimento: number;
}> {
  const candidates: Array<{ idConfigComercio: number; idHorarioAtendimento: number }> = [
    { idConfigComercio: comercioId, idHorarioAtendimento: comercioId },
  ];

  for (let i = 1; i <= 10; i += 1) {
    for (let j = 1; j <= 10; j += 1) {
      candidates.push({ idConfigComercio: i, idHorarioAtendimento: j });
    }
  }

  const seen = new Set<string>();
  return candidates.filter((item) => {
    const key = `${item.idConfigComercio}:${item.idHorarioAtendimento}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function isValidConfigResponse(data: unknown): data is Record<string, unknown> {
  return !!data && typeof data === 'object' && !Array.isArray(data);
}

/** A API retorna ids 0 quando a config já existe — detectar pelo objeto, não pelo id. */
export function serverConfigExists(data: unknown): boolean {
  if (!isValidConfigResponse(data)) return false;
  return (
    'configuracao' in data ||
    'Configuracao' in data ||
    'horarioAtendimento' in data ||
    'HorarioAtendimento' in data
  );
}

export function mapConfigFromApi(data: Record<string, unknown>, comercioId: number): ComercioConfiguracao {
  const horarioRaw = readRecord(data, 'horarioAtendimento', 'HorarioAtendimento');
  const configRaw = readRecord(data, 'configuracao', 'Configuracao');
  const funcsRaw = readRecord(data, 'funcionarios', 'Funcionarios');

  return {
    idHorarioAtendimento: Number(readRecord(data, 'idHorarioAtendimento', 'IdHorarioAtendimento') ?? 0),
    idConfigComercio: Number(readRecord(data, 'idConfigComercio', 'IdConfigComercio') ?? 0),
    horarioAtendimento: mapHorario(horarioRaw) ?? createDefaultConfig(comercioId).horarioAtendimento,
    configuracao: mapConfiguracao(configRaw, comercioId),
    funcionarios: Array.isArray(funcsRaw)
      ? funcsRaw.map(mapFuncionario).filter((f): f is ComercioConfigFuncionario => f !== null)
      : [],
  };
}

export type ConfigFetchFn = (
  endpoint: string,
  options?: RequestInit & { skipToast?: boolean; notFoundAsEmpty?: boolean }
) => Promise<unknown>;

/**
 * PUT exige IdConfigComercio/IdHorarioAtendimento reais. A API às vezes retorna 0 no GET;
 * tenta combinações prováveis até obter 200 (salva de fato no servidor).
 */
export async function saveConfigWithIdDiscovery(
  fetchApiFn: ConfigFetchFn,
  comercioId: number,
  config: ComercioConfiguracao
): Promise<ComercioConfiguracao> {
  const base = mergeConfigIdsFromCache(config, comercioId);
  const rawCandidates: Array<{ idConfigComercio: number; idHorarioAtendimento: number }> = [];

  if (hasValidConfigIds(base)) {
    rawCandidates.push({
      idConfigComercio: base.idConfigComercio!,
      idHorarioAtendimento: base.idHorarioAtendimento!,
    });
  }

  rawCandidates.push(...buildConfigIdCandidates(comercioId));

  const seen = new Set<string>();
  const candidates = rawCandidates.filter((item) => {
    const key = `${item.idConfigComercio}:${item.idHorarioAtendimento}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let lastError: unknown;

  for (const ids of candidates) {
    const attemptConfig = { ...base, ...ids };
    const payload = buildConfigComercioPayload(attemptConfig, comercioId, false);

    try {
      await fetchApiFn(`/api/ConfigComercio/Editar-Atendimento/${comercioId}`, {
        method: 'PUT',
        body: payload,
        skipToast: true,
      });
      setCachedConfigIds(comercioId, ids);
      return attemptConfig;
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : '';
      if (message.includes('404')) continue;
      throw err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Não foi possível atualizar a configuração. Os IDs internos não foram encontrados no servidor.');
}

function toApiDateTime(value: string): string {
  if (value.includes('T')) return value;
  return `${value}T00:00:00`;
}

function buildHorarioPayload(horario: HorarioAtendimento) {
  const payload: Record<string, unknown> = {
    dias: horario.dias,
    horaInicio: toApiTimeSpan(horario.horaInicio),
    horaFim: toApiTimeSpan(horario.horaFim),
    intervalo: horario.intervalo,
  };
  if (horario.intervalo && horario.inicioIntervalo) {
    payload.inicioIntervalo = toApiTimeSpan(horario.inicioIntervalo);
  }
  if (horario.intervalo && horario.fimIntervalo) {
    payload.fimIntervalo = toApiTimeSpan(horario.fimIntervalo);
  }
  return payload;
}

/** Monta body camelCase aceito pelo POST/PUT /api/ConfigComercio. */
export function buildConfigComercioPayload(
  newConfig: ComercioConfiguracao,
  comercioId: number,
  isNew: boolean
): Record<string, unknown> {
  const defaults = createDefaultConfig(comercioId);
  const horario = { ...defaults.horarioAtendimento!, ...newConfig.horarioAtendimento };
  const cfg = { ...defaults.configuracao!, ...newConfig.configuracao, comercioId };

  const payload: Record<string, unknown> = {
    horarioAtendimento: buildHorarioPayload(horario),
    configuracao: {
      comercioId,
      antecedenciaMin: cfg.antecedenciaMin,
      limiteAgendar: cfg.limiteAgendar,
      confirmaAuto: cfg.confirmaAuto,
      tempoDuracaoPadrao: cfg.tempoDuracaoPadrao,
      tempoCancelamento: cfg.tempoCancelamento,
      reagendar: cfg.reagendar,
      tempoIntervalo: cfg.tempoIntervalo ?? 0,
      agendaSimultanea: cfg.agendaSimultanea,
      horarioPorProfissional: cfg.horarioPorProfissional,
      fechaFeriadosNacionais: cfg.fechaFeriadosNacionais ?? false,
      fechaFeriadosMunicipais: cfg.fechaFeriadosMunicipais ?? false,
      diasFechados: (cfg.diasFechados ?? []).map((df) => ({
        ...(df.id ? { id: df.id } : {}),
        data: toApiDateTime(df.data),
        descricao: df.descricao ?? null,
      })),
    },
    funcionarios: (newConfig.funcionarios ?? [])
      .filter((f) => f.idFuncionario)
      .map((f) => {
        const funcPayload: Record<string, unknown> = {
          idFuncionario: f.idFuncionario,
          dias: f.dias,
          horaInicio: toApiTimeSpan(f.horaInicio),
          horaFim: toApiTimeSpan(f.horaFim),
          intervalo: f.intervalo,
        };
        if (f.intervalo && f.inicioIntervalo) {
          funcPayload.inicioIntervalo = toApiTimeSpan(f.inicioIntervalo);
        }
        if (f.intervalo && f.fimIntervalo) {
          funcPayload.fimIntervalo = toApiTimeSpan(f.fimIntervalo);
        }
        return funcPayload;
      }),
  };

  if (!isNew) {
    payload.idHorarioAtendimento = newConfig.idHorarioAtendimento ?? 0;
    payload.idConfigComercio = newConfig.idConfigComercio ?? 0;
  }

  return payload;
}
