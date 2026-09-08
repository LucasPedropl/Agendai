export interface ViaCepAddress {
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string;
}

interface ViaCepJson {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  complemento?: string;
}

export class ViaCepLookupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ViaCepLookupError';
  }
}

export async function lookupAddressByCep(cepDigits: string): Promise<ViaCepAddress | null> {
  const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
  if (!response.ok) {
    throw new ViaCepLookupError('Não foi possível consultar o CEP. Preencha o endereço manualmente.');
  }

  const payload = (await response.json()) as ViaCepJson;
  if (payload.erro) {
    return null;
  }

  return {
    rua: payload.logradouro ?? '',
    bairro: payload.bairro ?? '',
    cidade: payload.localidade ?? '',
    estado: payload.uf ?? '',
    complemento: payload.complemento ?? '',
  };
}
