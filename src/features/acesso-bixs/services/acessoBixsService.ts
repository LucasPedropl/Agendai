import { resolveAuthToken } from '@/lib/api';
import { ADMIN_ACCESS_DENIED_MESSAGE } from '@/lib/apiHelpers';
import {
  AcessoBixsRequestInput,
  AcessoBixsRequestInputSchema,
  AcessoBixsStatusQueryResult,
  AcessoBixsStatusSchema,
  ESTADO_ACESSO_TO_API,
  SendVerificationCodeResult,
  SendVerificationCodeResultSchema,
} from '../schemas';

const STATUS_URL = '/api/Comercios/status-acesso';
const SOLICITAR_URL = '/api/Comercios/solicitar-acesso';
/** Endpoint previsto — ainda não implementado na API do AgendaAi (pendente do time backend). */
const ENVIAR_CODIGO_URL = '/api/Comercios/enviar-codigo-acesso';

export class VerificationCodeEndpointMissingError extends Error {
  constructor() {
    super(
      'O envio automático do código ainda não está disponível nesta versão da API. ' +
        'Peça o código de verificação ao suporte Agendai e digite-o abaixo.',
    );
    this.name = 'VerificationCodeEndpointMissingError';
  }
}

function buildAuthHeaders(): HeadersInit {
  const token = resolveAuthToken();
  const headers: Record<string, string> = {
    accept: '*/*',
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseApiMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (!text.trim()) return '';

  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed === 'string') return parsed.trim();
    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>;
      const candidates = [record.message, record.error, record.detail, record.title];
      for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
          return candidate.trim();
        }
      }
    }
  } catch {
    // corpo em texto puro
  }

  return text.trim();
}

async function parseOptionalJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export const acessoBixsService = {
  async getStatus(): Promise<AcessoBixsStatusQueryResult> {
    const response = await fetch(STATUS_URL, { headers: buildAuthHeaders() });

    if (response.status === 404) {
      const message = await parseApiMessage(response);
      if (/controle de acesso não encontrado/i.test(message)) {
        return { kind: 'never_requested' };
      }
      if (/nenhum comercio vinculado como administrador/i.test(message)) {
        return { kind: 'no_admin_commerce' };
      }
      throw new Error(message || 'Status de integração não encontrado.');
    }

    if (response.status === 403) {
      return { kind: 'forbidden' };
    }

    if (response.status === 401) {
      throw new Error('Sua sessão expirou. Faça login novamente.');
    }

    if (!response.ok) {
      throw new Error((await parseApiMessage(response)) || 'Erro ao carregar status de integração.');
    }

    const raw: unknown = await response.json();
    const parsed = AcessoBixsStatusSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error('Resposta inválida ao carregar status de integração.');
    }

    return { kind: 'loaded', data: parsed.data };
  },

  async sendVerificationCode(): Promise<SendVerificationCodeResult> {
    const response = await fetch(ENVIAR_CODIGO_URL, {
      method: 'POST',
      headers: buildAuthHeaders(),
      body: JSON.stringify({}),
    });

    if (response.status === 404 || response.status === 405) {
      throw new VerificationCodeEndpointMissingError();
    }

    if (!response.ok) {
      throw new Error(
        (await parseApiMessage(response)) || 'Não foi possível enviar o código de verificação.',
      );
    }

    const raw = await parseOptionalJson(response);
    const parsed = SendVerificationCodeResultSchema.safeParse(raw);
    return parsed.success ? parsed.data : { sentTo: '', expiresInSeconds: 900 };
  },

  async requestAccess(input: AcessoBixsRequestInput): Promise<void> {
    const validated = AcessoBixsRequestInputSchema.parse(input);

    const response = await fetch(SOLICITAR_URL, {
      method: 'POST',
      headers: buildAuthHeaders(),
      // `Solicitado` (e não `Ativo`) porque este valor é o que o painel Master exibe
      // enquanto a solicitação está pendente — `Ativo` faria um módulo ainda não
      // provisionado aparecer como já liberado. Mesma escolha do PagWeb em produção.
      body: JSON.stringify({
        payment: validated.requestPayment
          ? ESTADO_ACESSO_TO_API.Solicitado
          : ESTADO_ACESSO_TO_API.Inativo,
        whatsapp: validated.requestWhatsapp
          ? ESTADO_ACESSO_TO_API.Solicitado
          : ESTADO_ACESSO_TO_API.Inativo,
        idEmpresa: 0,
        password: validated.password,
        verificationCode: validated.verificationCode.trim(),
      }),
    });

    if (!response.ok) {
      const apiMessage = (await parseApiMessage(response)).trim();

      // Ordem importa: 401 de senha vem com corpo; JWT expirado vem vazio
      if (/senha incorreta/i.test(apiMessage)) {
        throw new Error('Senha incorreta. Confirme a senha da sua conta de administrador.');
      }
      if (response.status === 401) {
        throw new Error('Sua sessão expirou. Faça login novamente e refaça a solicitação.');
      }
      if (response.status === 403) {
        throw new Error(ADMIN_ACCESS_DENIED_MESSAGE);
      }
      if (/já existe um controle de acesso/i.test(apiMessage)) {
        throw new Error(
          'Já existe uma solicitação ativa ou pendente para esta empresa. Atualize a página para ver o status. Se estiver inativa, use “Solicitar novamente”.',
        );
      }
      if (/usuário não é administrador de nenhuma empresa/i.test(apiMessage)) {
        throw new Error('Sua conta não está vinculada como administrador de nenhum estabelecimento.');
      }
      if (/usuário não encontrado/i.test(apiMessage)) {
        throw new Error('Conta inconsistente. Entre em contato com o suporte.');
      }
      if (/verificationcode/i.test(apiMessage) || /código de verificação/i.test(apiMessage)) {
        throw new Error(
          'Código de verificação inválido ou ausente. Envie um novo código e tente de novo.',
        );
      }
      if (/erro ao criar acesso/i.test(apiMessage)) {
        throw new Error(
          'A API não conseguiu criar o acesso na Bixs. Isso costuma ser código expirado (validade de 15 minutos) ou já utilizado — peça um novo código. Se persistir, é falha de integração no backend.',
        );
      }
      throw new Error(apiMessage || 'Erro ao solicitar acesso.');
    }
  },
};
