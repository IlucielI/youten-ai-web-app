import React from 'react';

export interface StepItem {
  number: number;
  title: string;
  subtitle?: string;
}

export interface StepTrackerProps {
  currentStep: number;
  steps?: StepItem[];
  onStepClick?: (stepNumber: number) => void;
  className?: string;
}

export const defaultSteps: StepItem[] = [
  { number: 1, title: 'Getting Started', subtitle: 'Project configuration' },
  { number: 2, title: 'Architecture', subtitle: 'Clean & Atomic patterns' },
  { number: 3, title: 'Components', subtitle: 'Design system library' },
  { number: 4, title: 'Production', subtitle: 'Docker & Testing ready' },
];

export const StepTracker: React.FC<StepTrackerProps> = ({
  currentStep,
  steps = defaultSteps,
  onStepClick,
  className = '',
}) => {
  return (
    <div className={`w-full py-4 ${className}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((step) => {
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;
          const isPending = currentStep < step.number;

          const cardBorder = isActive
            ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
            : isCompleted
            ? 'border-emerald-500/30 bg-emerald-500/10'
            : 'border-border bg-card text-card-foreground opacity-70';

          const numberBg = isActive
            ? 'bg-primary text-primary-foreground shadow-xs shadow-primary/30'
            : isCompleted
            ? 'bg-emerald-600 text-white'
            : 'bg-muted text-muted-foreground';

          return (
            <button
              key={step.number}
              type="button"
              disabled={isPending}
              onClick={() => onStepClick?.(step.number)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${cardBorder} ${
                isPending ? 'cursor-default' : 'cursor-pointer hover:border-primary/50'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${numberBg}`}
              >
                {isCompleted ? '✓' : step.number}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-bold truncate ${
                    isActive
                      ? 'text-primary'
                      : isCompleted
                      ? 'text-emerald-500'
                      : 'text-foreground'
                  }`}
                >
                  {step.title}
                </p>
                {step.subtitle && (
                  <p className="text-[10px] text-muted-foreground/80 truncate mt-0.5">{step.subtitle}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
