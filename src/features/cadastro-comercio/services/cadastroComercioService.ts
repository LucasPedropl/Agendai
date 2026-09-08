import { fetchApi } from '@/lib/api';
import { composeEnderecoLine } from '../composeEndereco';
import { digitsOnly } from '../formatters';
import type { CadastroComercioFormValues } from '../schemas';

export interface CreateComercioPayload {
  values: CadastroComercioFormValues;
  image: File | null;
}

export async function createComercio({ values, image }: CreateComercioPayload): Promise<void> {
  const data = new FormData();
  data.append('Nome', values.nome.trim());
  data.append('Endereco', composeEnderecoLine(values));
  data.append('Telefone', digitsOnly(values.telefone));
  data.append('CNPJ', digitsOnly(values.cnpj));
  data.append('Email', values.email.trim());
  data.append('Descricao', values.descricao.trim());
  data.append('Instagram', values.instagram.trim());
  data.append('Facebook', values.facebook.trim());
  data.append('Site', values.site.trim());
  data.append('NotificarAgendamento', String(values.notificarAgendamento));
  data.append('LembrarAgendamento', String(values.lembrarAgendamento));
  data.append('ResumoDiario', String(values.resumoDiario));
  data.append('Image', image ?? '');

  await fetchApi('/api/Comercios', {
    method: 'POST',
    body: data,
    skipToast: true,
  });
}
