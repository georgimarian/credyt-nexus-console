

# Revamp Product Creation Wizard to Match Credyt Pricing Documentation

## Overview

Restructure the wizard to guide users through Credyt's three pricing models (real-time usage-based, fixed recurring, hybrid) with proper documentation-aligned terminology, contextual explanations, and support for all pricing configurations including dimensional pricing, unit_and_volume calculation, tiered pricing, and entitlements.

## Revised Wizard Steps

```text
Step 1: Basics        - Name, code (unchanged)
Step 2: Pricing Model - Choose: Real-time PAYG, Fixed Subscription, or Hybrid
Step 3: Prices        - Add prices guided by chosen model, with full config options
Step 4: Entitlements  - Only shown for Fixed or Hybrid models
Step 5: Review        - Summary with all configuration
```

## Key Changes from Current Wizard

### 1. New Step: Pricing Model Selection (Step 2)

Insert a new step between Basics and Prices where the user picks one of three billing strategies. Each option shows:

- A plain-English description matching Credyt docs
- Real-world examples (OpenAI, Cursor, Clay)
- When to use it

Options:
- **Real-time usage-based** -- "Customers prepay. Usage deducts from balance instantly."
- **Fixed recurring** -- "Flat monthly/yearly fee, no usage metering."
- **Hybrid** -- "Subscription + included credits. Overage charged on usage."

The selected model pre-configures defaults for Step 3 (e.g., hybrid auto-adds a fixed price slot and suggests adding a usage price + entitlements).

### 2. Enhanced Pricing Step (Step 3)

Based on the selected model, the pricing form adapts:

- **Usage-based prices**: Support all three `usage_type` values from docs:
  - `unit` -- charge per occurrence (e.g., $0.50/image)
  - `volume` -- charge by quantity in payload (e.g., $0.001/token)
  - `unit_and_volume` -- both (e.g., $0.05/chat + $0.0001/token)

- **Dimensional pricing**: New UI to add billable dimensions (e.g., `model`) and define per-dimension rates. Shows example: "GPT-4: $0.03/token, GPT-3.5: $0.001/token"

- **Tiered pricing**: Allow defining tiers with `up_to` thresholds and different rates per tier

- **Fixed prices**: Amount + interval selector with contextual help

- Each field gets a brief doc-aligned explanation tooltip

### 3. Smart Entitlements Step (Step 4)

- Only appears when model is "fixed" or "hybrid"
- Explains entitlements in Credyt terms: "right-to-use grants bundled with subscription"
- Refresh strategy descriptions match docs: reset (expire-and-replace), rollover (carry unused), none (one-time)
- For hybrid model, shows guidance: "These credits will be consumed by your usage-based prices. When exhausted, overage charges apply."

### 4. Improved Review Step (Step 5)

- Shows a structured summary matching Credyt's product API payload format
- Displays the pricing model label
- For dimensional prices, shows the dimension/rate table
- Validates: hybrid must have both fixed + usage prices; real-time must have at least one usage price

## Technical Details

### Files Modified

**`src/components/products/CreateProductWizard.tsx`** -- Complete rewrite of the wizard:
- Add `pricingModel` state: `"realtime" | "fixed" | "hybrid"`
- Update `STEPS` array to 5 steps
- New `PricingModelStep` section with three selectable cards
- Enhanced price form with `unit_and_volume` support, dimensional pricing UI, and tiered pricing
- Conditional entitlements step visibility
- Updated review with model label and validation warnings

**`src/data/types.ts`** -- Minor update:
- Ensure `Price.usage_calculation` includes `"unit_and_volume"` (currently only has `"unit" | "volume" | "unit_volume"` -- rename to match docs terminology)

### No new dependencies required

All UI uses existing terminal-styled components (dashed borders, monospace fonts, toggle buttons).

