import { buildAuthHeaders, parseApiMessage } from '@/lib/api';
import { ADMIN_ACCESS_DENIED_MESSAGE } from '@/lib/apiHelpers';
import {
  AcessoBixsRequestInput,
  AcessoBixsRequestInputSchema,
  AcessoBixsStatusQueryResult,
  AcessoBixsStatusSchema,
  ESTADO_ACESSO_TO_API,
  SendVerificationCodeResult,
} from '../schemas';

const STATUS_URL = '/api/Comercios/status-acesso';
const SOLICITAR_URL = '/api/Comercios/solicitar-acesso';
/** GET, Admin-only. Dispara o e-mail de verificação da Bixs para o admin logado. */
const ENVIAR_CODIGO_URL = '/api/Comercios/verificationCode';

/**
 * A API em produção pode estar atrás do commit que introduziu o endpoint.
 * Nesse caso degradamos para o fluxo manual em vez de quebrar a tela.
 */
export class VerificationCodeEndpointMissingError extends Error {
  constructor() {
    super(
      'O envio automático do código ainda não está disponível nesta versão da API. ' +
        'Peça o código de verificação ao suporte Agendai e digite-o abaixo.',
    );
    this.name = 'VerificationCodeEndpointMissingError';
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
    const response = await fetch(ENVIAR_CODIGO_URL, { headers: buildAuthHeaders() });

    if (response.status === 405) {
      throw new VerificationCodeEndpointMissingError();
    }

    const message = await parseApiMessage(response);

    if (response.status === 404) {
      // 404 do endpoint (API antiga) x 404 de regra ("Nenhuma empresa vinculada...").
      if (/nenhuma empresa vinculada/i.test(message)) {
        throw new Error(
          'Sua conta não está vinculada como administrador de nenhum estabelecimento.',
        );
      }
      throw new VerificationCodeEndpointMissingError();
    }

    if (response.status === 401) {
      throw new Error('Sua sessão expirou. Faça login novamente.');
    }

    if (response.status === 403) {
      throw new Error(ADMIN_ACCESS_DENIED_MESSAGE);
    }

    if (!response.ok) {
      throw new Error(message || 'Não foi possível enviar o código de verificação.');
    }

    // A API devolve 200 mesmo quando a Bixs recusa o envio — o corpo é a única pista.
    if (/erro ao enviar email/i.test(message)) {
      throw new Error(
        'A Bixs recusou o envio do código. Tente novamente em alguns minutos; ' +
          'se persistir, é falha de integração no backend.',
      );
    }

    return { message };
  },

  async requestAccess(input: AcessoBixsRequestInput): Promise<void> {
    const validated = AcessoBixsRequestInputSchema.parse(input);

    // `Solicitado` (e não `Ativo`) porque este valor é o que o painel Master exibe
    // enquanto a solicitação está pendente — `Ativo` faria um módulo ainda não
    // provisionado aparecer como já liberado. Mesma escolha do PagWeb em produção.
    const payload: Record<string, unknown> = {
      payment: validated.requestPayment
        ? ESTADO_ACESSO_TO_API.Solicitado
        : ESTADO_ACESSO_TO_API.Inativo,
      whatsapp: validated.requestWhatsapp
        ? ESTADO_ACESSO_TO_API.Solicitado
        : ESTADO_ACESSO_TO_API.Inativo,
      password: validated.password,
    };

    // `verificationCode` virou opcional (nullable) no ControleViewPost; só é exigido
    // quando a API cria um controle novo. Na reativação o campo vai ausente.
    if (validated.verificationCode) {
      payload.verificationCode = validated.verificationCode;
    }

    const response = await fetch(SOLICITAR_URL, {
      method: 'POST',
      headers: buildAuthHeaders(),
      body: JSON.stringify(payload),
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
