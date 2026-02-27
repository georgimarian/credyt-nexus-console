import { Asset } from "./types";

export const assets: Asset[] = [
  {
    id: "asset_01",
    code: "USD",
    name: "US Dollar",
    type: "fiat",
    scale: 2,
    symbol: "$",
    rates: [],
  },
  {
    id: "asset_02",
    code: "CREDITS",
    name: "Credits",
    type: "custom",
    scale: 0,
    symbol: "CR",
    rates: [
      { from_asset: "USD", to_asset: "CREDITS", rate: 100, effective_at: "2024-09-01T00:00:00Z" },
      { from_asset: "USD", to_asset: "CREDITS", rate: 100, effective_at: "2025-01-01T00:00:00Z" },
    ],
  },
  {
    id: "asset_03",
    code: "TOK",
    name: "Tokens",
    type: "custom",
    scale: 0,
    symbol: "T",
    rates: [
      { from_asset: "USD", to_asset: "TOK", rate: 1000, effective_at: "2024-09-01T00:00:00Z" },
    ],
  },
];
