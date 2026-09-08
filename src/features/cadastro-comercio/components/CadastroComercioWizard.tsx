import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { WIZARD_STEPS } from '../schemas';
import { useCadastroComercioWizard } from '../hooks/useCadastroComercioWizard';
import { AddressStep } from './AddressStep';
import { ContactStep } from './ContactStep';
import { IdentityStep } from './IdentityStep';
import { SettingsStep } from './SettingsStep';
import { WizardStepper } from './WizardStepper';

interface CadastroComercioWizardProps {
  onSuccess?: () => void;
}

const STEP_COPY: Record<(typeof WIZARD_STEPS)[number]['id'], { title: string; description: string }> = {
  identity: {
    title: 'Configurar comércio',
    description: 'Nome, CNPJ e uma descrição curta do estabelecimento.',
  },
  address: {
    title: 'Endereço',
    description: 'Informe o ponto físico. O CEP preenche rua, bairro, cidade e UF.',
  },
  contact: {
    title: 'Contato',
    description: 'Como os clientes falam com o estabelecimento.',
  },
  settings: {
    title: 'Configurações',
    description: 'Logo e preferências de notificação.',
  },
};

export function CadastroComercioWizard({ onSuccess }: CadastroComercioWizardProps) {
  const wizard = useCadastroComercioWizard(onSuccess);
  const step = WIZARD_STEPS[wizard.stepIndex];
  const copy = STEP_COPY[step.id];

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (wizard.isLastStep) {
      void wizard.submit();
      return;
    }
    wizard.goNext();
  };

  return (
    <div className="w-full">
      <div className="mb-5 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Passo {wizard.stepIndex + 1} de {WIZARD_STEPS.length}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{copy.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
      </div>

      <WizardStepper stepIndex={wizard.stepIndex} onStepSelect={wizard.goToStep} />

      <form onSubmit={handleSubmit} className="space-y-5">
        {wizard.submitError && (
          <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            {wizard.submitError}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
            className="motion-reduce:transform-none motion-reduce:transition-none"
          >
            {step.id === 'identity' && (
              <IdentityStep
                values={wizard.values}
                fieldErrors={wizard.fieldErrors}
                onChange={wizard.updateTextField}
              />
            )}
            {step.id === 'address' && (
              <AddressStep
                values={wizard.values}
                fieldErrors={wizard.fieldErrors}
                onChange={wizard.updateTextField}
                onAddressAutofill={wizard.applyViaCepAddress}
              />
            )}
            {step.id === 'contact' && (
              <ContactStep
                values={wizard.values}
                fieldErrors={wizard.fieldErrors}
                onChange={wizard.updateTextField}
              />
            )}
            {step.id === 'settings' && (
              <SettingsStep
                values={wizard.values}
                imageName={wizard.image?.name ?? null}
                onToggle={(field, checked) => wizard.patchValues({ [field]: checked })}
                onImageChange={wizard.setImage}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 pt-1">
          {wizard.stepIndex > 0 && (
            <Button type="button" variant="outline" className="min-h-11 flex-1" onClick={wizard.goBack}>
              Voltar
            </Button>
          )}
          <Button type="submit" className="min-h-11 flex-1" disabled={wizard.isLoading}>
            {wizard.isLoading ? 'Salvando...' : wizard.isLastStep ? 'Finalizar cadastro' : 'Continuar'}
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          className="w-full text-xs text-muted-foreground"
          onClick={wizard.fillDevData}
        >
          Preencher dados aleatórios (dev)
        </Button>
      </form>
    </div>
  );
}
