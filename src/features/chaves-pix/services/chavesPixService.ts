import { buildAuthHeaders, parseApiMessage } from '@/lib/api';
import { ADMIN_ACCESS_DENIED_MESSAGE } from '@/lib/apiHelpers';
import {
  ChavePixFormInput,
  ChavePixFormSchema,
  ChavePixListSchema,
  ChavePixUpdateInput,
  ChavePixUpdateInputSchema,
  ChavesPixQueryResult,
} from '../schemas';

const BASE_URL = '/api/ChavesPix';

/**
 * `POST /api/ChavesPix` responde **BadRequest** quando a chave já existe — mas
 * antes disso ela é reativada (`Status = true`) e o `SaveChangesAsync` é
 * executado. Ou seja: a operação deu certo e foi comunicada como erro.
 * A UI precisa avisar o usuário e recarregar a lista, não tratar como falha.
 */
export class ChavePixReactivatedError extends Error {
  constructor() {
    super('Essa chave já estava cadastrada e foi reativada.');
    this.name = 'ChavePixReactivatedError';
  }
}

function throwForCommonStatuses(status: number, message: string): void {
  if (status === 401) {
    throw new Error('Sua sessão expirou. Faça login novamente.');
  }
  if (status === 403) {
    throw new Error(ADMIN_ACCESS_DENIED_MESSAGE);
  }
  if (message) {
    throw new Error(message);
  }
}

export const chavesPixService = {
  async list(): Promise<ChavesPixQueryResult> {
    const response = await fetch(BASE_URL, { headers: buildAuthHeaders() });

    if (response.status === 403) {
      return { kind: 'forbidden' };
    }

    if (!response.ok) {
      const message = await parseApiMessage(response);
      throwForCommonStatuses(response.status, message);
      throw new Error('Erro ao carregar chaves PIX.');
    }

    const raw: unknown = await response.json();
    const parsed = ChavePixListSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error('Resposta inválida ao carregar chaves PIX.');
    }

    return { kind: 'loaded', data: parsed.data };
  },

  async create(input: ChavePixFormInput): Promise<void> {
    const validated = ChavePixFormSchema.parse(input);

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: buildAuthHeaders(),
      body: JSON.stringify({
        chave: validated.chave,
        tipoChave: validated.tipoChave,
      }),
    });

    if (response.ok) return;

    const message = await parseApiMessage(response);

    if (/reativada/i.test(message)) {
      throw new ChavePixReactivatedError();
    }

    throwForCommonStatuses(response.status, message);
    throw new Error('Erro ao cadastrar chave PIX.');
  },

  async update(input: ChavePixUpdateInput): Promise<void> {
    const validated = ChavePixUpdateInputSchema.parse(input);

    const response = await fetch(`${BASE_URL}/${validated.idChave}`, {
      method: 'PUT',
      headers: buildAuthHeaders(),
      // `idChave` no corpo tem de bater com o da rota — o controller compara os dois.
      body: JSON.stringify({
        idChave: validated.idChave,
        chave: validated.chave,
        tipoChave: validated.tipoChave,
        ativa: validated.ativa,
      }),
    });

    if (response.ok) return;

    const message = await parseApiMessage(response);
    throwForCommonStatuses(response.status, message);
    throw new Error('Erro ao atualizar chave PIX.');
  },

  /**
   * `DELETE` é um soft-delete: a API marca `Status = false` e mantém a linha.
   * Reusar a mesma chave depois recai no caminho de reativação do POST.
   */
  async deactivate(idChavePix: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/${idChavePix}`, {
      method: 'DELETE',
      headers: buildAuthHeaders(),
    });

    if (response.ok) return;

    const message = await parseApiMessage(response);
    throwForCommonStatuses(response.status, message);
    throw new Error('Erro ao desativar chave PIX.');
  },
};
