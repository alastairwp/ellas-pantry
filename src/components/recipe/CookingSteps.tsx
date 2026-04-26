interface Step {
  stepNumber: number;
  instruction: string;
  tipText?: string | null;
}

interface CookingStepsProps {
  steps: Step[];
}

export function CookingSteps({ steps }: CookingStepsProps) {
  return (
    <div className="print-steps">
      <h2 className="text-xl font-semibold text-neutral-800 mb-6">
        Instructions
      </h2>

      <ol className="space-y-6">
        {steps.map((step) => (
          <li key={step.stepNumber} className="flex gap-4">
            {/* Step number */}
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-800 font-bold text-sm">
              {step.stepNumber}
            </div>

            <div className="flex-1 pt-1">
              {/* Instruction text */}
              <p className="text-neutral-700 leading-relaxed">
                {step.instruction}
              </p>

              {/* Tip callout */}
              {step.tipText && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <span className="font-semibold">Tip:</span> {step.tipText}
                  </p>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
