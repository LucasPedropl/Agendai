import { useState } from 'react';
import { getFriendlyErrorMessage, hasApiStatus } from '@/lib/errors';
import { formatCep, formatCnpj, formatTelefone } from '../formatters';
import {
  CadastroComercioFormSchema,
  emptyCadastroComercioForm,
  fieldErrorsFromZod,
  validateWizardStep,
  WIZARD_STEPS,
  type CadastroComercioFormValues,
} from '../schemas';
import { createComercio } from '../services/cadastroComercioService';
import type { ViaCepAddress } from '../viaCep';

const LAST_STEP_INDEX = WIZARD_STEPS.length - 1;

export function useCadastroComercioWizard(onSuccess?: () => void) {
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<CadastroComercioFormValues>(emptyCadastroComercioForm);
  const [image, setImage] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isLastStep = stepIndex === LAST_STEP_INDEX;

  const patchValues = (patch: Partial<CadastroComercioFormValues>) => {
    setValues((previous) => ({ ...previous, ...patch }));
  };

  const updateTextField = (field: keyof CadastroComercioFormValues, raw: string) => {
    let next = raw;
    if (field === 'cnpj') next = formatCnpj(raw);
    if (field === 'telefone') next = formatTelefone(raw);
    if (field === 'cep') next = formatCep(raw);
    if (field === 'estado') next = raw.toUpperCase().slice(0, 2);
    patchValues({ [field]: next });
    setFieldErrors((previous) => {
      if (!previous[field]) return previous;
      const { [field]: _removed, ...rest } = previous;
      return rest;
    });
  };

  const applyViaCepAddress = (address: ViaCepAddress) => {
    setValues((previous) => ({
      ...previous,
      rua: address.rua || previous.rua,
      bairro: address.bairro || previous.bairro,
      cidade: address.cidade || previous.cidade,
      estado: address.estado || previous.estado,
      complemento: address.complemento || previous.complemento,
    }));
  };

  const goToStep = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex > LAST_STEP_INDEX) return;
    if (nextIndex > stepIndex) {
      const errors = validateWizardStep(stepIndex, values);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
    }
    setFieldErrors({});
    setSubmitError('');
    setStepIndex(nextIndex);
  };

  const goNext = () => goToStep(stepIndex + 1);
  const goBack = () => goToStep(stepIndex - 1);

  const submit = async () => {
    const parsed = CadastroComercioFormSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      const firstInvalidStep = [0, 1, 2, 3].find(
        (index) => Object.keys(validateWizardStep(index, values)).length > 0,
      );
      if (firstInvalidStep !== undefined) {
        setStepIndex(firstInvalidStep);
      }
      return;
    }

    setIsLoading(true);
    setSubmitError('');
    try {
      await createComercio({ values, image });
      onSuccess?.();
    } catch (err: unknown) {
      console.error(err);
      if (hasApiStatus(err, 403)) {
        setSubmitError(
          'Sem permissão para criar comércio. Sua conta precisa ser de Administrador (cadastro como Estabelecimento). ' +
            'Após reset do banco de testes, pode ser necessário recadastrar em /cadastro/estabelecimento.',
        );
      } else {
        setSubmitError(
          getFriendlyErrorMessage(
            err,
            'Erro ao cadastrar comércio. Verifique os dados e tente novamente.',
          ),
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillDevData = () => {
    const randomString = Math.random().toString(36).substring(2, 8);
    const randomPhone = `279${Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('')}`;
    setValues({
      nome: `Comércio ${randomString}`,
      cnpj: formatCnpj('12345678000190'),
      descricao: 'Salão de beleza com atendimento agendado e equipe especializada.',
      cep: formatCep('29015110'),
      rua: 'Avenida Jerônimo Monteiro',
      numero: '123',
      complemento: 'Sala 2',
      bairro: 'Centro',
      cidade: 'Vitória',
      estado: 'ES',
      referencia: 'Próximo à Praça Oito',
      telefone: formatTelefone(randomPhone),
      email: values.email || 'jdncbdb2005@gmail.com',
      instagram: '@teste_insta',
      facebook: 'fb.com/teste',
      site: 'www.teste.com',
      notificarAgendamento: true,
      lembrarAgendamento: true,
      resumoDiario: true,
    });
    setFieldErrors({});
    setSubmitError('');
  };

  return {
    stepIndex,
    isLastStep,
    values,
    image,
    fieldErrors,
    submitError,
    isLoading,
    updateTextField,
    patchValues,
    setImage,
    applyViaCepAddress,
    goNext,
    goBack,
    goToStep,
    submit,
    fillDevData,
  };
}
