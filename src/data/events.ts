import { UsageEvent } from "./types";

const baseEvents: Partial<UsageEvent>[] = [
  { event_type: "chat_completion", customer_id: "cust_01", customer_name: "Acme Corp", properties: { model: "gpt-4o", total_tokens: 1520, prompt_tokens: 1200, completion_tokens: 320, model_tier: "premium" }, fees: [{ product_code: "enterprise", price_id: "price_05", amount: 0.0912, asset_code: "USD", dimensions: { model_tier: "premium" } }], costs: [{ vendor_id: "vendor_01", vendor_name: "OpenAI", amount: 0.045, asset_code: "USD" }] },
  { event_type: "chat_completion", customer_id: "cust_02", customer_name: "TechStart AI", properties: { model: "gpt-4o-mini", total_tokens: 890, prompt_tokens: 700, completion_tokens: 190 }, fees: [{ product_code: "ai-agent-payg", price_id: "price_01", amount: 0.0267, asset_code: "USD" }], costs: [{ vendor_id: "vendor_01", vendor_name: "OpenAI", amount: 0.012, asset_code: "USD" }] },
  { event_type: "image_generation", customer_id: "cust_06", customer_name: "AIsmith", properties: { model: "dall-e-3", size: "1024x1024", quality: "hd" }, fees: [{ product_code: "ai-agent-payg", price_id: "price_02", amount: 0.04, asset_code: "USD" }], costs: [{ vendor_id: "vendor_01", vendor_name: "OpenAI", amount: 0.02, asset_code: "USD" }] },
  { event_type: "chat_completion", customer_id: "cust_03", customer_name: "Neural Labs", properties: { model: "gpt-4o", total_tokens: 2100, prompt_tokens: 1800, completion_tokens: 300 }, fees: [{ product_code: "pro-plan", price_id: "price_04", amount: 2100, asset_code: "CREDITS" }], costs: [{ vendor_id: "vendor_01", vendor_name: "OpenAI", amount: 0.063, asset_code: "USD" }] },
  { event_type: "image_generation", customer_id: "cust_01", customer_name: "Acme Corp", properties: { model: "stable-diffusion-xl", size: "1024x1024" }, fees: [{ product_code: "enterprise", price_id: "price_05", amount: 0.02, asset_code: "USD" }], costs: [{ vendor_id: "vendor_02", vendor_name: "Replicate", amount: 0.008, asset_code: "USD" }] },
  { event_type: "chat_completion", customer_id: "cust_04", customer_name: "DataFlow Inc", properties: { model: "gpt-4o", total_tokens: 3400, prompt_tokens: 3000, completion_tokens: 400 }, fees: [{ product_code: "ai-agent-payg", price_id: "price_01", amount: 0.102, asset_code: "USD" }], costs: [{ vendor_id: "vendor_01", vendor_name: "OpenAI", amount: 0.05, asset_code: "USD" }] },
  { event_type: "chat_completion", customer_id: "cust_05", customer_name: "CloudMind", properties: { model: "gpt-4o-mini", total_tokens: 450, prompt_tokens: 350, completion_tokens: 100 }, fees: [{ product_code: "pro-plan", price_id: "price_04", amount: 450, asset_code: "CREDITS" }], costs: [{ vendor_id: "vendor_01", vendor_name: "OpenAI", amount: 0.005, asset_code: "USD" }] },
  { event_type: "video_generation", customer_id: "cust_04", customer_name: "DataFlow Inc", properties: { model: "stable-video", duration_seconds: 4, resolution: "720p" }, fees: [{ product_code: "ai-agent-payg", price_id: "price_02", amount: 0.12, asset_code: "USD" }], costs: [{ vendor_id: "vendor_02", vendor_name: "Replicate", amount: 0.065, asset_code: "USD" }] },
  { event_type: "chat_completion", customer_id: "cust_01", customer_name: "Acme Corp", properties: { model: "gpt-4o", total_tokens: 980, prompt_tokens: 800, completion_tokens: 180, model_tier: "standard" }, fees: [{ product_code: "enterprise", price_id: "price_05", amount: 0.0196, asset_code: "USD", dimensions: { model_tier: "standard" } }], costs: [{ vendor_id: "vendor_01", vendor_name: "OpenAI", amount: 0.01, asset_code: "USD" }] },
  { event_type: "chat_completion", customer_id: "cust_02", customer_name: "TechStart AI", properties: { model: "gpt-4o", total_tokens: 5200, prompt_tokens: 4800, completion_tokens: 400 }, fees: [{ product_code: "ai-agent-payg", price_id: "price_01", amount: 0.156, asset_code: "USD" }], costs: [{ vendor_id: "vendor_01", vendor_name: "OpenAI", amount: 0.08, asset_code: "USD" }] },
];

function generateEvents(): UsageEvent[] {
  const events: UsageEvent[] = [];
  const now = new Date("2025-02-23T12:00:00Z");

  for (let i = 0; i < 55; i++) {
    const base = baseEvents[i % baseEvents.length]!;
    const hoursAgo = Math.floor(Math.random() * 720); // within last 30 days
    const timestamp = new Date(now.getTime() - hoursAgo * 3600000);

    events.push({
      id: `evt_${String(i + 1).padStart(3, "0")}`,
      event_type: base.event_type!,
      customer_id: base.customer_id!,
      customer_name: base.customer_name!,
      timestamp: timestamp.toISOString(),
      properties: { ...base.properties },
      status: Math.random() > 0.05 ? "processed" : "failed",
      fees: base.fees ? [...base.fees] : [],
      costs: base.costs ? [...base.costs] : [],
    });
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export const events: UsageEvent[] = generateEvents();
