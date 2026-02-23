

# Credyt Admin Dashboard

A terminal-inspired admin backend for Credyt — the wallet-native billing engine for AI. Built with mock data, structured for easy API swap-in. Designed for vibe coders and indie hackers.

---

## Design System & Global Setup

- **Fonts**: Doto (logo), Space Mono (headings/buttons), IBM Plex Mono (body/data)
- **Colors**: Brutalist monochrome palette with green/red/yellow accents for status
- **Theme toggle**: Dark mode (default) + light mode
- **Components**: ASCII-bordered cards (`┌─ TITLE ─┐`), dotted-border tables, terminal-style progress bars (`████░░`), monospace throughout
- **Layout**: Collapsible sidebar navigation with icon-only mini mode

---

## Navigation Structure (Sidebar)

```
┌─ CREDYT ─────────────┐
│ ▸ Overview            │
│ ▸ Products            │
│ ▸ Customers           │
│ ▸ Events              │
│ ▸ Assets              │
│ ▸ Vendors             │
│ ▸ Webhooks            │
│ ▸ Settings            │
└───────────────────────┘
```

---

## Page 1: Overview Dashboard (`/`)

Terminal-style command center with high-level KPIs and recent activity.

**KPI Cards (ASCII-bordered):**
- Total Customers (with trend)
- Total Revenue
- Total Costs
- Gross Margin %

**Charts:**
- Revenue vs Costs over 30 days (area chart)
- Events processed per day (bar chart)

**Recent Activity Feed:**
- Terminal-style log: `$ [timestamp] [event_type] customer_id → amount`

---

## Page 2: Products (`/products`)

**Product List View:**
- Table: Code, Name, Status, # Prices, # Subscribers
- Search/filter by code
- Actions: View (navigates to detail page), Create New

## Page 2b: Product Detail (`/products/:id`)

**Dedicated full page** with breadcrumb navigation (`Products > AI Agent PAYG`).

- Product info header: name, code, status badge
- **Prices section**: list of prices with type (usage/fixed), billing model (real-time/recurring), dimensions, entitlements
- **Edit/Create mode**: inline form for adding prices with usage calculation config, dimensional pricing tables, entitlements
- **Usage Simulator**: test event payload → see calculated fees inline
- **Version History**: version list (draft/published/archived), visual diff between versions
- **Subscribers list**: customers subscribed to this product

---

## Page 3: Customers (`/customers`)

**Customer List View:**
- Table: Name, Email, External ID, # Subscriptions, Wallet Balance, Created
- Search by name or external_id

## Page 3b: Customer Detail (`/customers/:id`)

**Dedicated full page** with breadcrumb navigation (`Customers > Acme Corp`).

- **Info header**: name, email, external_id, metadata, created date
- **Tabbed sections**:
  - **Subscriptions tab**: product subscriptions with status, start date. Actions: add, update, cancel
  - **Wallet tab**: account balances per asset, credit grants (purpose, effective/expiry, remaining), transaction history (charges, top-ups, adjustments). Quick actions: create adjustment, charge, top-up
  - **Events tab**: filtered event log for this customer

---

## Page 4: Events (`/events`)

- Terminal-styled scrollable event log
- Each row: timestamp, event_id, customer, event_type, properties preview, status
- Expandable row → full JSON payload, generated fees breakdown, associated costs
- Filters: customer_id, event_type, date range
- Pagination

---

## Page 5: Assets (`/assets`)

- Table: Code, Name, Type (fiat/custom), Scale
- Create new custom asset
- Detail inline or expandable: exchange rates history, add rate, quote calculator

---

## Page 6: Vendors (`/vendors`)

- Table: Name, External ID, Created
- Create/edit vendors
- Cost summary: total costs by vendor (bar chart)
- Costs linked to events with vendor, amount, customer context

---

## Page 7: Webhooks (`/webhooks`)

- List endpoints: URL, subscribed events, status
- Create/edit: URL + event type selector
- Delivery log with status codes and retry info

---

## Page 8: Settings (`/settings`)

- API key (masked + copy)
- Connected accounts
- Stripe connection status
- Billing portal customization preview

---

## Mock Data

- **3 Products**: "AI Agent PAYG" (usage-based, real-time), "Pro Plan" (fixed monthly + overage), "Enterprise" (dimensional by model tier)
- **8 Customers**: varied balances, subscriptions, usage patterns
- **50+ Events**: across event types with realistic properties and fees
- **2 Assets**: USD + "Credits" (custom, 1 USD = 100 credits)
- **2 Vendors**: "OpenAI" and "Replicate" with costs

---

## Data Layer

- Mock data in `/src/data/`
- Service layer in `/src/services/` matching API endpoints
- React Query hooks for caching/loading states
- Designed for easy swap to real Credyt API `fetch()` calls

