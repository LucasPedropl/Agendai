import { WIZARD_STEPS } from '../schemas';
import { cn } from '@/lib/utils';

interface WizardStepperProps {
  stepIndex: number;
  onStepSelect: (index: number) => void;
}

export function WizardStepper({ stepIndex, onStepSelect }: WizardStepperProps) {
  return (
    <nav aria-label="Etapas do cadastro" className="mb-6">
      <ol className="grid grid-cols-4 gap-1">
        {WIZARD_STEPS.map((step, index) => {
          const isCurrent = index === stepIndex;
          const isComplete = index < stepIndex;
          const isReachable = index <= stepIndex;
          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!isReachable}
                onClick={() => onStepSelect(index)}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'flex w-full min-h-11 flex-col items-center gap-1.5 rounded-xl px-1 py-1 text-center transition-colors',
                  isReachable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
                  isCurrent && 'bg-primary/10',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                    isCurrent || isComplete
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {index + 1}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-semibold leading-tight sm:text-xs',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
