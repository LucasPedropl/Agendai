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
  let horaInicio = String(readRecord(h, 'horaInicio', 'HoraInicio') ?? '08:00:00');
  let horaFim = String(readRecord(h, 'horaFim', 'HoraFim') ?? '18:00:00');

  if (horaInicio.startsWith('00:00') && horaFim.startsWith('00:00')) {
    horaInicio = '08:00:00';
    horaFim = '18:00:00';
  }

  return {
    dias: Array.isArray(dias) ? (dias as number[]) : [1, 2, 3, 4, 5],
    horaInicio,
    horaFim,
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

export function isValidConfigResponse(data: unknown): data is Record<string, unknown> {
  return !!data && typeof data === 'object' && !Array.isArray(data);
}

/**
 * A API sempre devolve o objeto `configuracao` (com valores padrão quando não há nada
 * gravado), então a presença do objeto não diz nada. O que diz é o id: o GET devolve
 * `idConfigComercio = 0` quando o comércio ainda não tem configuração no banco.
 */
export function configExistsOnServer(config: ComercioConfiguracao): boolean {
  return (config.idConfigComercio ?? 0) > 0;
}

export function validateBusinessHours(config: ComercioConfiguracao): string | null {
  if (!config.horarioAtendimento || !config.horarioAtendimento.dias || config.horarioAtendimento.dias.length === 0) {
    return 'Selecione ao menos um dia de atendimento.';
  }

  const horaInicio = config.horarioAtendimento.horaInicio?.slice(0, 5) ?? '';
  const horaFim = config.horarioAtendimento.horaFim?.slice(0, 5) ?? '';
  if (horaFim <= horaInicio) {
    return 'O horário de fechamento deve ser depois da abertura.';
  }

  if (config.configuracao?.horarioPorProfissional && config.funcionarios && config.funcionarios.length > 0) {
    for (const f of config.funcionarios) {
      const fInicio = f.horaInicio?.slice(0, 5) ?? '';
      const fFim = f.horaFim?.slice(0, 5) ?? '';
      if (fFim <= fInicio) {
        return 'O horário de fechamento de cada profissional deve ser depois da abertura.';
      }
    }
  }

  return null;
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

/**
 * Monta body camelCase aceito pelo POST/PUT /api/ConfigComercio.
 *
 * No PUT, os ids vão exatamente como o GET devolveu — nunca adivinhados. O PUT da API
 * busca a configuração e o horário pelo id do corpo sem conferir o comércio, então um id
 * chutado grava na linha de outro estabelecimento (relatório do devhub, 04/11/2026).
 */
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
