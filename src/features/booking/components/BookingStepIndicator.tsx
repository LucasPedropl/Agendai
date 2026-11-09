import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface BookingStepIndicatorProps {
  currentStep: number; // 2: Serviço, 3: Profissional, 4: Horário, 5: Confirmar
}

const STEPS = [
  { step: 1, label: 'Loja' },
  { step: 2, label: 'Serviço' },
  { step: 3, label: 'Profissional' },
  { step: 4, label: 'Horário' },
];

export function BookingStepIndicator({ currentStep }: BookingStepIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-10">
      <div className="flex items-center w-full max-w-2xl px-4">
        {STEPS.map(({ step: s, label }) => {
          const isDone = currentStep > s;
          const isCurrent = currentStep === s;

          return (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center relative z-10">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                    ${
                      isCurrent
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110 shadow-lg'
                        : isDone
                          ? 'bg-green-500 text-white'
                          : 'bg-accent text-muted-foreground'
                    }
                  `}
                >
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                <span
                  className={`text-[10px] absolute -bottom-6 font-bold uppercase tracking-wider whitespace-nowrap ${
                    isCurrent ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </span>
              </div>
              {s < 4 && (
                <div className="flex-1 mx-2 h-1 bg-accent rounded-full relative overflow-hidden">
                  <motion.div
                    initial={false}
                    animate={{ width: isDone ? '100%' : '0%' }}
                    className="absolute inset-0 bg-green-500"
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
