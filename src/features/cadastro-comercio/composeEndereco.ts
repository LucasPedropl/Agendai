import { formatCep } from './formatters';
import type { CadastroComercioFormValues } from './schemas';

/** A API POST /api/Comercios só aceita `Endereco` como string única. */
export function composeEnderecoLine(values: CadastroComercioFormValues): string {
  const streetNumber = values.complemento.trim()
    ? `${values.rua.trim()}, ${values.numero.trim()} — ${values.complemento.trim()}`
    : `${values.rua.trim()}, ${values.numero.trim()}`;

  const cityLine = `${values.bairro.trim()}, ${values.cidade.trim()} - ${values.estado}`;
  const cepLine = `CEP ${formatCep(values.cep)}`;
  const parts = [streetNumber, cityLine, cepLine];

  if (values.referencia.trim()) {
    parts.push(`Ref.: ${values.referencia.trim()}`);
  }

  return parts.join(', ');
}
