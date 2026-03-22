import { useState, useCallback, useEffect } from "react";
import {
  OnboardingState,
  OnboardingSelections,
  OnboardingReview,
  loadOnboardingState,
  saveOnboardingState,
  dismissOnboarding,
  getReviewDefaults,
} from "./onboardingState";
import Step1UseCase from "./Step1UseCase";
import Step2Currency from "./Step2Currency";
import Step3Pricing from "./Step3Pricing";
import ReviewStep from "./ReviewStep";
import RunSetupStep from "./RunSetupStep";

interface Props {
  onDismiss: () => void;
}

export default function OnboardingWizard({ onDismiss }: Props) {
  const [state, setState] = useState<OnboardingState>(loadOnboardingState);

  const persist = useCallback((newState: OnboardingState) => {
    setState(newState);
    saveOnboardingState(newState);
  }, []);

  const updateSelections = useCallback(
    (partial: Partial<OnboardingSelections>) => {
      const newState = { ...state, selections: { ...state.selections, ...partial } };
      persist(newState);
    },
    [state, persist]
  );

  const updateReview = useCallback(
    (partial: Partial<OnboardingReview>) => {
      const newState = { ...state, review: { ...state.review, ...partial } };
      persist(newState);
    },
    [state, persist]
  );

  const goToStep = useCallback(
    (step: number) => {
      const newState = { ...state, currentStep: step };
      persist(newState);
    },
    [state, persist]
  );

  const handleSkip = () => {
    dismissOnboarding();
    onDismiss();
  };

  const handleStartOver = () => {
    const fresh: OnboardingState = {
      ...state,
      currentStep: 1,
      selections: { useCase: "", currency: "", pricingType: "", volumeField: "", rate: "", flatCharge: "", dimensions: { field: "", tiers: [] } },
      review: { productName: "", productCode: "", eventType: "" },
    };
    persist(fresh);
  };

  const goToReview = () => {
    const defaults = getReviewDefaults(state.selections.useCase);
    const newState = {
      ...state,
      currentStep: 4,
      review: {
        productName: state.review.productName || defaults.productName,
        productCode: state.review.productCode || defaults.productCode,
        eventType: state.review.eventType || defaults.eventType,
      },
    };
    persist(newState);
  };

  const step = state.currentStep;

  return (
    <div className="py-10">
      <div className="max-w-2xl mx-auto px-6">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="font-mono text-[22px] font-bold text-white mb-2">
            Welcome — let's get your first product live.
          </h1>
          <p className="font-mono text-[13px] text-[#555] leading-relaxed">
            This takes about 5 minutes.
            <br />
            Doing it yourself, one endpoint at a time, is totally possible. This is just faster.
          </p>
        </div>

        {/* Wizard card */}
        <div
          className="p-8 mb-6"
          style={{ backgroundColor: "#0d0d0d", border: "1px dashed #2a2a2a" }}
        >
          {step === 1 && (
            <Step1UseCase
              selected={state.selections.useCase}
              onSelect={(key) => updateSelections({ useCase: key })}
              onContinue={() => goToStep(2)}
            />
          )}
          {step === 2 && (
            <Step2Currency
              selected={state.selections.currency}
              onSelect={(v) => updateSelections({ currency: v })}
              onBack={() => goToStep(1)}
              onContinue={() => goToStep(3)}
            />
          )}
          {step === 3 && (
            <Step3Pricing
              selections={state.selections}
              onUpdate={updateSelections}
              onBack={() => goToStep(2)}
              onContinue={goToReview}
            />
          )}
          {step === 4 && (
            <ReviewStep
              review={state.review}
              onUpdate={updateReview}
              onBack={() => goToStep(3)}
              onConfigure={() => goToStep(5)}
            />
          )}
          {step === 5 && (
            <RunSetupStep
              state={state}
              onStateUpdate={persist}
              onBack={() => goToStep(4)}
            />
          )}
        </div>

        {/* Bottom links */}
        <div className="flex items-center justify-center gap-6">
          <button onClick={handleSkip} className="font-mono text-[13px] text-[#444] underline underline-offset-2 hover:text-[#666] transition-colors">
            Skip for now
          </button>
          {step > 1 && (
            <button onClick={handleStartOver} className="font-mono text-[13px] text-[#444] underline underline-offset-2 hover:text-[#666] transition-colors">
              Start over
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
