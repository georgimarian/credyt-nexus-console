export interface Product {
  id: string;
  code: string;
  name: string;
  status: "active" | "archived" | "draft";
  created_at: string;
  prices: Price[];
  versions: ProductVersion[];
  subscriber_count: number;
}

export interface Price {
  id: string;
  type: "usage" | "fixed";
  billing_model: "real_time" | "recurring";
  recurring_interval?: "monthly" | "yearly";
  event_type?: string;
  usage_calculation?: "unit" | "volume" | "unit_volume";
  volume_field?: string;
  dimensions?: string[];
  amount?: number;
  asset_code: string;
  unit_price?: number;
  volume_rate?: number;
  tiers?: PriceTier[];
  entitlements?: Entitlement[];
}

export interface PriceTier {
  up_to: number | null;
  unit_price: number;
  volume_rate?: number;
  dimensions?: Record<string, string>;
}

export interface Entitlement {
  asset_code: string;
  amount: number;
  refresh_strategy: "none" | "reset" | "rollover";
  schedule?: string;
}

export interface ProductVersion {
  version: number;
  status: "draft" | "published" | "archived";
  created_at: string;
  published_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  external_id: string;
  metadata?: Record<string, string>;
  created_at: string;
  subscriptions: Subscription[];
  wallet: Wallet;
}

export interface Subscription {
  id: string;
  product_id: string;
  product_name: string;
  status: "active" | "pending" | "cancelled";
  start_date: string;
  end_date?: string;
}

export interface Wallet {
  accounts: WalletAccount[];
  credit_grants: CreditGrant[];
  transactions: Transaction[];
}

export interface WalletAccount {
  asset_code: string;
  available: number;
  pending_in: number;
  pending_out: number;
}

export interface CreditGrant {
  id: string;
  asset_code: string;
  amount: number;
  remaining: number;
  purpose: "paid" | "promotional" | "included";
  effective_at: string;
  expires_at?: string;
}

export interface Transaction {
  id: string;
  type: "charge" | "top_up" | "adjustment" | "credit_grant";
  amount: number;
  asset_code: string;
  description: string;
  created_at: string;
  event_id?: string;
}

export interface UsageEvent {
  id: string;
  event_type: string;
  customer_id: string;
  customer_name: string;
  timestamp: string;
  properties: Record<string, any>;
  status: "processed" | "pending" | "failed";
  fees?: Fee[];
  costs?: Cost[];
}

export interface Fee {
  product_code: string;
  price_id: string;
  amount: number;
  asset_code: string;
  dimensions?: Record<string, string>;
}

export interface Cost {
  vendor_id: string;
  vendor_name: string;
  amount: number;
  asset_code: string;
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  type: "fiat" | "custom";
  scale: number;
  symbol?: string;
  rates: ExchangeRate[];
}

export interface ExchangeRate {
  from_asset: string;
  to_asset: string;
  rate: number;
  effective_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  external_id: string;
  created_at: string;
  total_costs: number;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  status: "active" | "inactive";
  created_at: string;
  deliveries: WebhookDelivery[];
}

export interface WebhookDelivery {
  id: string;
  event_type: string;
  status_code: number;
  delivered_at: string;
  retries: number;
}
