import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { digitsOnly } from '../formatters';
import type { CadastroComercioFormValues } from '../schemas';
import { lookupAddressByCep, ViaCepLookupError, type ViaCepAddress } from '../viaCep';
import { BrazilianUfSelect } from './BrazilianUfSelect';
import { FormField } from './FormField';

interface AddressStepProps {
  values: CadastroComercioFormValues;
  fieldErrors: Record<string, string>;
  onChange: (field: keyof CadastroComercioFormValues, value: string) => void;
  onAddressAutofill: (address: ViaCepAddress) => void;
}

export function AddressStep({
  values,
  fieldErrors,
  onChange,
  onAddressAutofill,
}: AddressStepProps) {
  const [cepStatus, setCepStatus] = useState<'idle' | 'loading' | 'found' | 'missing' | 'offline'>('idle');
  const [cepMessage, setCepMessage] = useState('');
  const cepRequestIdRef = useRef(0);

  const handleCepChange = async (raw: string) => {
    onChange('cep', raw);
    const cepDigits = digitsOnly(raw);
    if (cepDigits.length < 8) {
      cepRequestIdRef.current += 1;
      setCepStatus('idle');
      setCepMessage('');
      return;
    }

    const requestId = cepRequestIdRef.current + 1;
    cepRequestIdRef.current = requestId;
    setCepStatus('loading');
    setCepMessage('Buscando CEP...');
    try {
      const address = await lookupAddressByCep(cepDigits);
      if (requestId !== cepRequestIdRef.current) return;
      if (!address) {
        setCepStatus('missing');
        setCepMessage('CEP não encontrado. Preencha o endereço manualmente.');
        return;
      }
      onAddressAutofill(address);
      setCepStatus('found');
      setCepMessage('Endereço preenchido pelo CEP.');
    } catch (error: unknown) {
      if (requestId !== cepRequestIdRef.current) return;
      console.error(error);
      const fallback =
        error instanceof ViaCepLookupError
          ? error.message
          : 'Falha ao consultar o CEP. Preencha o endereço manualmente.';
      setCepStatus('offline');
      setCepMessage(fallback);
    }
  };

  return (
    <div className="space-y-4">
      <FormField htmlFor="cep" label="CEP" error={fieldErrors.cep} hint={fieldErrors.cep ? undefined : cepMessage}>
        <Input
          id="cep"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          maxLength={9}
          value={values.cep}
          disabled={cepStatus === 'loading'}
          aria-invalid={Boolean(fieldErrors.cep)}
          aria-busy={cepStatus === 'loading'}
          onChange={(event) => void handleCepChange(event.target.value)}
        />
      </FormField>

      <FormField htmlFor="rua" label="Rua / logradouro" error={fieldErrors.rua}>
        <Input
          id="rua"
          autoComplete="address-line1"
          placeholder="Avenida Paulista"
          value={values.rua}
          aria-invalid={Boolean(fieldErrors.rua)}
          onChange={(event) => onChange('rua', event.target.value)}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField htmlFor="numero" label="Número" error={fieldErrors.numero}>
          <Input
            id="numero"
            placeholder="1000"
            value={values.numero}
            aria-invalid={Boolean(fieldErrors.numero)}
            onChange={(event) => onChange('numero', event.target.value)}
          />
        </FormField>
        <FormField htmlFor="complemento" label="Complemento" error={fieldErrors.complemento}>
          <Input
            id="complemento"
            autoComplete="address-line2"
            placeholder="Sala 2"
            value={values.complemento}
            onChange={(event) => onChange('complemento', event.target.value)}
          />
        </FormField>
      </div>

      <FormField htmlFor="bairro" label="Bairro" error={fieldErrors.bairro}>
        <Input
          id="bairro"
          placeholder="Bela Vista"
          value={values.bairro}
          aria-invalid={Boolean(fieldErrors.bairro)}
          onChange={(event) => onChange('bairro', event.target.value)}
        />
      </FormField>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <FormField htmlFor="cidade" label="Cidade" error={fieldErrors.cidade}>
            <Input
              id="cidade"
              autoComplete="address-level2"
              placeholder="São Paulo"
              value={values.cidade}
              aria-invalid={Boolean(fieldErrors.cidade)}
              onChange={(event) => onChange('cidade', event.target.value)}
            />
          </FormField>
        </div>
        <FormField htmlFor="estado" label="UF" error={fieldErrors.estado}>
          <BrazilianUfSelect
            id="estado"
            value={values.estado}
            hasError={Boolean(fieldErrors.estado)}
            onChange={(nextUf) => onChange('estado', nextUf)}
          />
        </FormField>
      </div>

      <FormField htmlFor="referencia" label="Ponto de referência" error={fieldErrors.referencia}>
        <Input
          id="referencia"
          placeholder="Em frente à praça"
          value={values.referencia}
          onChange={(event) => onChange('referencia', event.target.value)}
        />
      </FormField>
    </div>
  );
}
