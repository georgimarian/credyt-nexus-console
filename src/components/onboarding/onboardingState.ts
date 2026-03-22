export interface DimensionTier {
  value: string;
  rate: string;
}

export interface OnboardingSelections {
  useCase: string;
  currency: "usd" | "custom" | "";
  pricingType: "unit" | "volume" | "unit_and_volume" | "";
  volumeField: string;
  rate: string;
  flatCharge: string;
  dimensions: {
    field: string;
    tiers: DimensionTier[];
  };
}

export interface OnboardingReview {
  productName: string;
  productCode: string;
  eventType: string;
}

export type StepStatus = "idle" | "running" | "success" | "failed";

export interface OnboardingRunSetup {
  customer1Id: string;
  customer2Id: string;
  startFromStep: number;
  stepStates: Record<string, StepStatus>;
}

export interface OnboardingState {
  dismissed: boolean;
  currentStep: number;
  selections: OnboardingSelections;
  review: OnboardingReview;
  runSetup: OnboardingRunSetup;
}

const STORAGE_KEY = "credyt_onboarding";

export const defaultState: OnboardingState = {
  dismissed: false,
  currentStep: 1,
  selections: {
    useCase: "",
    currency: "",
    pricingType: "",
    volumeField: "",
    rate: "",
    flatCharge: "",
    dimensions: { field: "", tiers: [] },
  },
  review: { productName: "", productCode: "", eventType: "" },
  runSetup: {
    customer1Id: "",
    customer2Id: "",
    startFromStep: 1,
    stepStates: {
      create_product: "idle",
      create_customer_1: "idle",
      create_customer_2: "idle",
      fund_wallets: "idle",
      send_events: "idle",
      verify_balances: "idle",
    },
  },
};

export function loadOnboardingState(): OnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState, ...JSON.parse(raw) };
  } catch {}
  return { ...defaultState };
}

export function saveOnboardingState(state: OnboardingState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function dismissOnboarding() {
  const state = loadOnboardingState();
  state.dismissed = true;
  saveOnboardingState(state);
}

export function getUseCaseLabel(useCase: string): string {
  const map: Record<string, string> = {
    ai_generation: "generation",
    search: "search",
    processing: "processing",
    conversations: "conversation",
    in_app_purchases: "purchase",
    something_else: "event",
  };
  return map[useCase] || "event";
}

export function getUseCaseUnit(useCase: string): string {
  const map: Record<string, string> = {
    ai_generation: "generation",
    search: "search",
    processing: "job",
    conversations: "conversation",
    in_app_purchases: "purchase",
    something_else: "event",
  };
  return map[useCase] || "event";
}

export function getReviewDefaults(useCase: string) {
  const map: Record<string, { productName: string; productCode: string; eventType: string }> = {
    ai_generation: { productName: "AI Generation", productCode: "ai_generation", eventType: "generation_completed" },
    search: { productName: "Search & retrieval", productCode: "search__retrieval", eventType: "data_search_completed" },
    processing: { productName: "Processing", productCode: "processing", eventType: "processing_completed" },
    conversations: { productName: "Conversations", productCode: "conversations", eventType: "conversation_completed" },
    in_app_purchases: { productName: "In-app purchases", productCode: "in_app_purchases", eventType: "purchase_completed" },
    something_else: { productName: "My Product", productCode: "my_product", eventType: "event_completed" },
  };
  return map[useCase] || { productName: "My Product", productCode: "my_product", eventType: "event_completed" };
}
