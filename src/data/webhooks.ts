import { WebhookEndpoint } from "./types";

export const webhooks: WebhookEndpoint[] = [
  {
    id: "wh_01",
    url: "https://api.acmecorp.ai/webhooks/credyt",
    events: ["event.processed", "wallet.low_balance", "subscription.created"],
    status: "active",
    created_at: "2024-10-01T00:00:00Z",
    deliveries: [
      { id: "del_01", event_type: "event.processed", status_code: 200, delivered_at: "2025-02-23T10:00:00Z", retries: 0 },
      { id: "del_02", event_type: "wallet.low_balance", status_code: 200, delivered_at: "2025-02-22T18:30:00Z", retries: 0 },
      { id: "del_03", event_type: "event.processed", status_code: 500, delivered_at: "2025-02-22T14:00:00Z", retries: 3 },
      { id: "del_04", event_type: "subscription.created", status_code: 200, delivered_at: "2025-02-20T09:00:00Z", retries: 0 },
    ],
  },
  {
    id: "wh_02",
    url: "https://hooks.slack.com/services/T01/B02/xyz123",
    events: ["wallet.low_balance"],
    status: "active",
    created_at: "2025-01-15T00:00:00Z",
    deliveries: [
      { id: "del_05", event_type: "wallet.low_balance", status_code: 200, delivered_at: "2025-02-23T08:00:00Z", retries: 0 },
    ],
  },
  {
    id: "wh_03",
    url: "https://old-endpoint.example.com/billing",
    events: ["event.processed"],
    status: "inactive",
    created_at: "2024-08-01T00:00:00Z",
    deliveries: [
      { id: "del_06", event_type: "event.processed", status_code: 404, delivered_at: "2025-01-10T12:00:00Z", retries: 3 },
    ],
  },
];
