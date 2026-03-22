import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle, ChevronDown, ChevronRight } from "lucide-react";
import { OnboardingState, StepStatus, dismissOnboarding, saveOnboardingState } from "./onboardingState";
import { useProductStore } from "@/stores/productStore";

const SETUP_STEPS = [
  { key: "create_product", label: "Create product" },
  { key: "create_customer_1", label: "Create customer 1" },
  { key: "create_customer_2", label: "Create customer 2" },
  { key: "fund_wallets", label: "Fund test wallets" },
  { key: "send_events", label: "Send test usage events" },
  { key: "verify_balances", label: "Verify wallet balances" },
];

interface Props {
  state: OnboardingState;
  onStateUpdate: (s: OnboardingState) => void;
  onBack: () => void;
}

function statusBadge(status: StepStatus) {
  const styles: Record<StepStatus, { bg: string; text: string; label: string }> = {
    idle: { bg: "#f3f4f6", text: "#6b7280", label: "IDLE" },
    running: { bg: "#dbeafe", text: "#1e40af", label: "RUNNING" },
    success: { bg: "#dcfce7", text: "#166534", label: "SUCCESS" },
    failed: { bg: "#fee2e2", text: "#991b1b", label: "FAILED" },
  };
  const s = styles[status];
  return (
    <span
      className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 inline-flex items-center gap-1"
      style={{ backgroundColor: s.bg, color: s.text, borderRadius: "2px", border: `1px solid ${s.text}22` }}
    >
      {status === "running" && <Loader2 size={10} className="animate-spin" />}
      {status === "success" && <CheckCircle2 size={10} />}
      {status === "failed" && <XCircle size={10} />}
      {s.label}
    </span>
  );
}

export default function RunSetupStep({ state, onStateUpdate, onBack }: Props) {
  const navigate = useNavigate();
  const addProduct = useProductStore((s) => s.addProduct);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [stepResults, setStepResults] = useState<Record<string, { request: any; response: any }>>({});
  const [isRunning, setIsRunning] = useState(false);

  const allSuccess = SETUP_STEPS.every((s) => state.runSetup.stepStates[s.key] === "success");

  const inputStyle: React.CSSProperties = {
    borderBottom: "1px dashed #bbb",
    borderTop: "none",
    borderLeft: "none",
    borderRight: "none",
    background: "transparent",
    outline: "none",
    fontFamily: "monospace",
    fontSize: "14px",
    padding: "4px 0",
    color: "#111",
    width: "100%",
  };

  const simulateStep = useCallback(
    async (key: string, idx: number): Promise<boolean> => {
      // Build simulated request/response based on step
      const { review, selections } = state;
      let request: any = {};
      let response: any = {};

      switch (key) {
        case "create_product":
          request = {
            method: "POST",
            url: "/v1/products",
            body: {
              name: review.productName,
              code: review.productCode,
              version: "v1",
              status: "active",
              prices: [{
                event_type: review.eventType,
                billing_model: "real_time",
                calculation: selections.pricingType === "unit" ? "unit" : selections.pricingType === "volume" ? "volume" : "unit_and_volume",
                ...(selections.volumeField ? { volume_field: selections.volumeField } : {}),
                ...(selections.rate ? { unit_price: `${selections.rate} USD` } : {}),
                ...(selections.flatCharge ? { flat_fee: `${selections.flatCharge} USD` } : {}),
              }],
            },
          };
          response = { id: `prp_onb_${Date.now().toString(36)}`, status: "active", ...request.body };

          // Actually add product to store
          addProduct({
            id: response.id,
            name: review.productName,
            code: review.productCode,
            version: "v1",
            status: "active",
            prices: [{
              id: `price_onb_${Date.now().toString(36)}`,
              event_type: review.eventType,
              billing_model: "real_time" as const,
              calculation: (selections.pricingType === "unit" ? "unit" : selections.pricingType === "volume" ? "volume" : "unit_and_volume") as any,
              volume_field: selections.volumeField || undefined,
              unit_price: { amount: parseFloat(selections.rate || selections.flatCharge || "0"), asset_code: "USD" },
              dimensions: [],
            }],
            subscriptions: [],
          });
          break;

        case "create_customer_1":
          request = { method: "POST", url: "/v1/customers", body: { name: "Test Customer 1", external_id: `test_cust_1_${Date.now().toString(36)}`, email: "test1@example.com", currency: selections.currency === "usd" ? "USD" : "CREDITS" } };
          response = { id: `cust_onb_1_${Date.now().toString(36)}`, ...request.body, status: "active" };
          break;

        case "create_customer_2":
          request = { method: "POST", url: "/v1/customers", body: { name: "Test Customer 2", external_id: `test_cust_2_${Date.now().toString(36)}`, email: "test2@example.com", currency: selections.currency === "usd" ? "USD" : "CREDITS" } };
          response = { id: `cust_onb_2_${Date.now().toString(36)}`, ...request.body, status: "active" };
          break;

        case "fund_wallets":
          request = { method: "POST", url: "/v1/adjustments", body: { customers: ["customer_1", "customer_2"], amount: 100, asset: "USD", reason: "test_funding" } };
          response = { status: "processed", adjustments: 2 };
          break;

        case "send_events":
          request = { method: "POST", url: "/v1/events", body: { events: [{ event_type: review.eventType, customer_id: "customer_1", data: { [selections.volumeField || "quantity"]: 100 } }, { event_type: review.eventType, customer_id: "customer_2", data: { [selections.volumeField || "quantity"]: 50 } }] } };
          response = { processed: 2, failed: 0 };
          break;

        case "verify_balances":
          request = { method: "GET", url: "/v1/wallets?customer_ids=customer_1,customer_2" };
          response = { wallets: [{ customer_id: "customer_1", available: 99.0 }, { customer_id: "customer_2", available: 99.5 }] };
          break;
      }

      setStepResults((prev) => ({ ...prev, [key]: { request, response } }));
      return true;
    },
    [state, addProduct]
  );

  const runSetup = useCallback(async () => {
    setIsRunning(true);
    const startFrom = state.runSetup.startFromStep || 1;

    for (let i = 0; i < SETUP_STEPS.length; i++) {
      const step = SETUP_STEPS[i];
      if (i + 1 < startFrom) {
        const newState = { ...state };
        newState.runSetup.stepStates[step.key] = "success";
        onStateUpdate(newState);
        continue;
      }

      // Set running
      const runningState = { ...state, runSetup: { ...state.runSetup, stepStates: { ...state.runSetup.stepStates, [step.key]: "running" as StepStatus } } };
      onStateUpdate(runningState);
      saveOnboardingState(runningState);

      await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

      try {
        await simulateStep(step.key, i);
        const successState = { ...state, runSetup: { ...state.runSetup, stepStates: { ...state.runSetup.stepStates, [step.key]: "success" as StepStatus } } };
        onStateUpdate(successState);
        saveOnboardingState(successState);
        // Update state for next iteration
        state.runSetup.stepStates[step.key] = "success";
      } catch {
        const failedState = { ...state, runSetup: { ...state.runSetup, stepStates: { ...state.runSetup.stepStates, [step.key]: "failed" as StepStatus } } };
        onStateUpdate(failedState);
        saveOnboardingState(failedState);
        setIsRunning(false);
        return;
      }
    }
    setIsRunning(false);
  }, [state, onStateUpdate, simulateStep]);

  const handleGoToEvents = () => {
    dismissOnboarding();
    navigate("/events");
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-green-600 text-lg">✅</span>
        <span className="font-mono text-[15px] font-bold text-green-700">Configuration saved — running setup</span>
      </div>
      <p className="font-mono text-[13px] text-[#888] mb-6">
        Hit Run Setup and watch each API call fire in sequence — this is exactly what you'd do manually, one endpoint at a time.
      </p>

      {/* Resume options */}
      <div className="border border-dashed border-[#ccc] p-4 bg-[#f9f9f5] mb-6" style={{ borderRadius: "4px" }}>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-[#999] block mb-2">Start from step</label>
            <input
              style={inputStyle}
              type="number"
              min={1}
              max={6}
              value={state.runSetup.startFromStep}
              onChange={(e) => {
                const newState = { ...state, runSetup: { ...state.runSetup, startFromStep: parseInt(e.target.value) || 1 } };
                onStateUpdate(newState);
              }}
            />
          </div>
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-[#999] block mb-2">Customer 1 ID</label>
            <input
              style={inputStyle}
              value={state.runSetup.customer1Id}
              onChange={(e) => {
                const newState = { ...state, runSetup: { ...state.runSetup, customer1Id: e.target.value } };
                onStateUpdate(newState);
              }}
              placeholder="cust_…"
            />
          </div>
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-[#999] block mb-2">Customer 2 ID</label>
            <input
              style={inputStyle}
              value={state.runSetup.customer2Id}
              onChange={(e) => {
                const newState = { ...state, runSetup: { ...state.runSetup, customer2Id: e.target.value } };
                onStateUpdate(newState);
              }}
              placeholder="cust_…"
            />
          </div>
        </div>
      </div>

      {/* Run button */}
      <button
        onClick={runSetup}
        disabled={isRunning}
        className="w-full font-mono text-[13px] font-bold px-6 py-3 bg-[#111] text-white hover:bg-[#222] transition-colors mb-6 flex items-center justify-center gap-2"
        style={{ borderRadius: "4px", opacity: isRunning ? 0.7 : 1 }}
      >
        {isRunning && <Loader2 size={14} className="animate-spin" />}
        {isRunning ? "Running…" : "Run Setup"}
      </button>

      {/* Step rows */}
      <div className="space-y-2">
        {SETUP_STEPS.map((step) => {
          const status = state.runSetup.stepStates[step.key] || "idle";
          const isExpanded = expandedStep === step.key;
          const result = stepResults[step.key];

          return (
            <div key={step.key} className="border border-dashed border-[#ccc]" style={{ borderRadius: "4px" }}>
              <button
                onClick={() => setExpandedStep(isExpanded ? null : step.key)}
                className="w-full flex items-center justify-between p-3 hover:bg-[#f9f9f5] transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown size={12} className="text-[#999]" /> : <ChevronRight size={12} className="text-[#999]" />}
                  <span className="font-mono text-[13px] text-[#333]">{step.label}</span>
                </div>
                {statusBadge(status)}
              </button>
              {isExpanded && result && (
                <div className="border-t border-dashed border-[#ccc] p-3">
                  <div className="mb-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#999]">Request</span>
                    <pre className="bg-[#1a1a1a] text-[#e5e5e5] p-3 font-mono text-[11px] mt-1 overflow-x-auto" style={{ borderRadius: "2px" }}>
                      {JSON.stringify(result.request, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#999]">Response</span>
                    <pre className="bg-[#1a1a1a] text-[#e5e5e5] p-3 font-mono text-[11px] mt-1 overflow-x-auto" style={{ borderRadius: "2px" }}>
                      {JSON.stringify(result.response, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Success state */}
      {allSuccess && (
        <div className="mt-6 p-5 border border-solid border-green-300 bg-[#f0fdf4]" style={{ borderRadius: "4px" }}>
          <div className="font-mono text-[14px] font-bold text-green-800 mb-1">✓ All checks passed — your billing is live.</div>
          <p className="font-mono text-[12px] text-green-700 mb-4">
            Your events are live. Go see how your fees are tracking.
          </p>
          <button
            onClick={handleGoToEvents}
            className="w-full font-mono text-[13px] font-bold px-6 py-2.5 bg-green-700 text-white hover:bg-green-800 transition-colors"
            style={{ borderRadius: "4px" }}
          >
            Go to Events →
          </button>
        </div>
      )}

      <div className="flex justify-start mt-6">
        <button onClick={onBack} className="font-mono text-[13px] px-4 py-2 border border-dashed border-[#bbb] text-[#888] bg-transparent" style={{ borderRadius: "4px" }}>
          ← Back
        </button>
      </div>
    </div>
  );
}
