import { Customer } from "./types";

export const customers: Customer[] = [
  {
    id: "cust_01",
    name: "Acme Corp",
    email: "billing@acmecorp.ai",
    external_id: "acme-001",
    status: "active",
    metadata: { plan: "enterprise", industry: "fintech" },
    created_at: "2024-09-15T13:00:00Z",
    auto_topup: { enabled: true, threshold: 50, amount: 500 },
    subscriptions: [
      { id: "sub_01", product_id: "prod_03", product_name: "Enterprise", status: "active", start_date: "2024-09-15T13:00:00Z" },
    ],
    wallet: {
      accounts: [
        { asset_code: "USD", available: 1247.32, pending_in: 0, pending_out: 12.50 },
        { asset_code: "TOK", available: 8500, pending_in: 0, pending_out: 0 },
      ],
      credit_grants: [
        { id: "cg_01", asset_code: "USD", amount: 200, remaining: 152.68, purpose: "included", effective_at: "2025-02-01T00:00:00Z", expires_at: "2025-03-01T00:00:00Z" },
      ],
      transactions: [
        { id: "tx_01", type: "top_up", amount: 1000, asset_code: "USD", description: "Initial deposit", created_at: "2024-09-15T13:30:00Z" },
        { id: "tx_01b", type: "top_up", amount: 500, asset_code: "USD", description: "Auto top-up triggered", created_at: "2024-10-12T09:15:00Z" },
        { id: "tx_01c", type: "top_up", amount: 500, asset_code: "USD", description: "Auto top-up triggered", created_at: "2024-11-28T16:45:00Z" },
        { id: "tx_01d", type: "top_up", amount: 500, asset_code: "USD", description: "Auto top-up triggered", created_at: "2025-01-08T11:20:00Z" },
        { id: "tx_02", type: "charge", amount: -45.20, asset_code: "USD", description: "chat_completion usage", created_at: "2025-02-20T14:00:00Z", event_id: "evt_01" },
        { id: "tx_03", type: "credit_grant", amount: 200, asset_code: "USD", description: "Monthly included credits", created_at: "2025-02-01T00:00:00Z" },
        { id: "tx_04", type: "charge", amount: -8.12, asset_code: "USD", description: "image_generation usage", created_at: "2025-02-22T09:15:00Z", event_id: "evt_05" },
        { id: "tx_t01", type: "top_up", amount: 10000, asset_code: "TOK", description: "TOK allocation", created_at: "2024-09-15T14:00:00Z" },
        { id: "tx_t02", type: "charge", amount: -500, asset_code: "TOK", description: "api_call usage", created_at: "2025-02-20T11:00:00Z", event_id: "evt_tok01" },
        { id: "tx_t03", type: "charge", amount: -500, asset_code: "TOK", description: "api_call usage", created_at: "2025-02-18T14:00:00Z", event_id: "evt_tok02" },
        { id: "tx_t04", type: "charge", amount: -500, asset_code: "TOK", description: "api_call usage", created_at: "2025-02-15T09:00:00Z", event_id: "evt_tok03" },
      ],
    },
  },
  {
    id: "cust_02",
    name: "TechStart AI",
    email: "hello@techstart.ai",
    external_id: "ts-002",
    status: "active",
    created_at: "2024-10-20T08:00:00Z",
    auto_topup: { enabled: true, threshold: 10, amount: 25 },
    subscriptions: [
      { id: "sub_02", product_id: "prod_01", product_name: "AI Agent PAYG", status: "active", start_date: "2024-10-20T08:00:00Z" },
    ],
    wallet: {
      accounts: [
        { asset_code: "USD", available: 87.45, pending_in: 0, pending_out: 0 },
      ],
      credit_grants: [],
      transactions: [
        { id: "tx_05", type: "top_up", amount: 100, asset_code: "USD", description: "First top-up", created_at: "2024-10-20T08:30:00Z" },
        { id: "tx_06", type: "charge", amount: -12.55, asset_code: "USD", description: "chat_completion usage", created_at: "2025-02-21T16:00:00Z" },
      ],
    },
  },
  {
    id: "cust_03",
    name: "Neural Labs",
    email: "ops@neurallabs.co",
    external_id: "nl-003",
    status: "active",
    created_at: "2024-11-05T12:00:00Z",
    subscriptions: [
      { id: "sub_03", product_id: "prod_02", product_name: "Pro Plan", status: "active", start_date: "2024-11-05T12:00:00Z" },
    ],
    wallet: {
      accounts: [
        { asset_code: "USD", available: 49.00, pending_in: 0, pending_out: 0 },
        { asset_code: "CREDITS", available: 4521, pending_in: 0, pending_out: 0 },
      ],
      credit_grants: [
        { id: "cg_02", asset_code: "CREDITS", amount: 10000, remaining: 4521, purpose: "included", effective_at: "2025-02-01T00:00:00Z", expires_at: "2025-03-01T00:00:00Z" },
      ],
      transactions: [
        { id: "tx_07", type: "charge", amount: -49, asset_code: "USD", description: "Pro Plan monthly", created_at: "2025-02-01T00:00:00Z" },
        { id: "tx_08", type: "credit_grant", amount: 10000, asset_code: "CREDITS", description: "Monthly credits reset", created_at: "2025-02-01T00:00:00Z" },
        { id: "tx_09", type: "charge", amount: -5479, asset_code: "CREDITS", description: "chat_completion usage", created_at: "2025-02-22T11:00:00Z" },
      ],
    },
  },
  {
    id: "cust_04",
    name: "DataFlow Inc",
    email: "admin@dataflow.io",
    external_id: "df-004",
    status: "active",
    created_at: "2024-12-01T09:00:00Z",
    auto_topup: { enabled: true, threshold: 25, amount: 100 },
    subscriptions: [
      { id: "sub_04", product_id: "prod_01", product_name: "AI Agent PAYG", status: "active", start_date: "2024-12-01T09:00:00Z" },
    ],
    wallet: {
      accounts: [
        { asset_code: "USD", available: 312.88, pending_in: 25.00, pending_out: 3.20 },
      ],
      credit_grants: [
        { id: "cg_03", asset_code: "USD", amount: 50, remaining: 50, purpose: "promotional", effective_at: "2025-01-01T00:00:00Z", expires_at: "2025-06-01T00:00:00Z" },
      ],
      transactions: [
        { id: "tx_10", type: "top_up", amount: 500, asset_code: "USD", description: "Deposit", created_at: "2024-12-01T09:30:00Z" },
        { id: "tx_11", type: "charge", amount: -187.12, asset_code: "USD", description: "chat_completion usage", created_at: "2025-02-18T10:00:00Z" },
      ],
    },
  },
  {
    id: "cust_05",
    name: "CloudMind",
    email: "team@cloudmind.dev",
    external_id: "cm-005",
    status: "active",
    created_at: "2025-01-10T14:00:00Z",
    subscriptions: [
      { id: "sub_05", product_id: "prod_02", product_name: "Pro Plan", status: "active", start_date: "2025-01-10T14:00:00Z" },
    ],
    wallet: {
      accounts: [
        { asset_code: "USD", available: 0, pending_in: 0, pending_out: 0 },
        { asset_code: "CREDITS", available: 8923, pending_in: 0, pending_out: 0 },
      ],
      credit_grants: [
        { id: "cg_04", asset_code: "CREDITS", amount: 10000, remaining: 8923, purpose: "included", effective_at: "2025-02-10T00:00:00Z", expires_at: "2025-03-10T00:00:00Z" },
      ],
      transactions: [
        { id: "tx_12", type: "charge", amount: -49, asset_code: "USD", description: "Pro Plan monthly", created_at: "2025-02-10T00:00:00Z" },
        { id: "tx_13", type: "charge", amount: -1077, asset_code: "CREDITS", description: "chat_completion usage", created_at: "2025-02-21T08:00:00Z" },
      ],
    },
  },
  {
    id: "cust_06",
    name: "AIsmith",
    email: "dev@aismith.tools",
    external_id: "as-006",
    status: "active",
    created_at: "2025-01-20T11:00:00Z",
    subscriptions: [
      { id: "sub_06", product_id: "prod_01", product_name: "AI Agent PAYG", status: "active", start_date: "2025-01-20T11:00:00Z" },
    ],
    wallet: {
      accounts: [
        { asset_code: "USD", available: 23.10, pending_in: 0, pending_out: 0 },
      ],
      credit_grants: [],
      transactions: [
        { id: "tx_14", type: "top_up", amount: 50, asset_code: "USD", description: "Starter deposit", created_at: "2025-01-20T11:30:00Z" },
        { id: "tx_15", type: "charge", amount: -26.90, asset_code: "USD", description: "chat_completion + image_generation", created_at: "2025-02-22T15:00:00Z" },
      ],
    },
  },
  {
    id: "cust_07",
    name: "Quantum Dev",
    email: "support@quantumdev.sh",
    external_id: "qd-007",
    status: "active",
    created_at: "2025-01-25T16:00:00Z",
    subscriptions: [
      { id: "sub_07", product_id: "prod_01", product_name: "AI Agent PAYG", status: "pending", start_date: "2025-02-01T00:00:00Z" },
    ],
    wallet: {
      accounts: [
        { asset_code: "USD", available: 150.00, pending_in: 0, pending_out: 0 },
      ],
      credit_grants: [],
      transactions: [
        { id: "tx_16", type: "top_up", amount: 150, asset_code: "USD", description: "Initial top-up", created_at: "2025-01-25T16:30:00Z" },
      ],
    },
  },
  {
    id: "cust_08",
    name: "ByteForge",
    email: "billing@byteforge.ai",
    external_id: "bf-008",
    status: "suspended",
    created_at: "2025-02-01T09:00:00Z",
    subscriptions: [
      { id: "sub_08", product_id: "prod_02", product_name: "Pro Plan", status: "cancelled", start_date: "2025-02-01T09:00:00Z", end_date: "2025-02-15T00:00:00Z" },
    ],
    wallet: {
      accounts: [
        { asset_code: "USD", available: 0, pending_in: 0, pending_out: 0 },
        { asset_code: "CREDITS", available: 0, pending_in: 0, pending_out: 0 },
      ],
      credit_grants: [],
      transactions: [
        { id: "tx_17", type: "charge", amount: -49, asset_code: "USD", description: "Pro Plan monthly", created_at: "2025-02-01T00:00:00Z" },
        { id: "tx_18", type: "adjustment", amount: 49, asset_code: "USD", description: "Refund - plan cancelled", created_at: "2025-02-15T00:00:00Z" },
      ],
    },
  },
];
