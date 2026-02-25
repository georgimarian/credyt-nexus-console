import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { products } from "@/data/products";
import type { UsageEvent } from "@/data/types";

function formatTimeParts(ts: string) {
  const d = new Date(ts);
  const mo = d.toLocaleString("en-US", { month: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${mo} ${day} ${h}:${m}:${s}`;
}

interface Props {
  event: UsageEvent;
  customerExternalId?: string;
  onClose: () => void;
}

export function EventDetailSheet({ event, customerExternalId, onClose }: Props) {
  const [showRaw, setShowRaw] = useState(false);
  const navigate = useNavigate();
  const fee = event.fees?.[0];
  const dims = event.properties ? Object.entries(event.properties) : [];

  // Find matched product/price
  const matchedProduct = fee ? products.find(p => p.code === fee.product_code || p.prices.some(pr => pr.id === fee.price_id)) : null;

  useEffect(() => {
    setShowRaw(false);
  }, [event.id]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const fieldRow = (label: string, value: React.ReactNode, className?: string) => (
    <div className="flex justify-between py-2 border-b border-white/[0.08]">
      <span className="font-space text-xs uppercase text-white/40 w-32 shrink-0 tracking-wider">{label}</span>
      <span className={`text-sm font-ibm-plex text-right ${className || "text-white"}`}>{value}</span>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed right-0 top-0 h-screen w-[420px] bg-[#0F0F0F] border-l border-white/10 z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.08] shrink-0">
          <span className="font-space text-xs text-white/40">┌─ EVENT DETAILS ──────────────────────┐</span>
          <button onClick={onClose} className="text-white/40 hover:text-white text-lg cursor-pointer transition-colors font-mono">×</button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {/* Identity row */}
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
            <span className="font-ibm-plex text-sm font-bold text-white">{event.id}</span>
            <span className="font-ibm-plex text-xs text-white/40">{formatTimeParts(event.timestamp)}</span>
            <StatusBadge status={event.status} />
          </div>

          {/* Field rows */}
          <div>
            {fieldRow("Customer",
              <button
                onClick={() => { onClose(); navigate(`/customers/${event.customer_id}`); }}
                className="text-white hover:text-white/80 underline underline-offset-2 decoration-white/20 cursor-pointer transition-colors"
              >
                {event.customer_name} · {event.customer_id}{customerExternalId ? ` · ${customerExternalId}` : ""}
              </button>
            )}
            {fieldRow("Event Type", event.event_type)}
            {fieldRow("Fee", fee ? `$${fee.amount.toFixed(4)} ${fee.asset_code}` : "—", fee ? "text-[#4ADE80]" : "text-white/40")}
            {fieldRow("Billing Model", fee ? (products.find(p => p.prices.some(pr => pr.id === fee.price_id))?.prices.find(pr => pr.id === fee.price_id)?.billing_model || "—") : "—")}
            {fieldRow("Product", matchedProduct ? (
              <span className="flex items-center gap-2 justify-end">
                {matchedProduct.name}
                <span className="border border-white/20 text-white/60 text-xs px-1.5 py-0.5 font-ibm-plex">{matchedProduct.code}</span>
              </span>
            ) : "—")}
            {fieldRow("Price", fee?.price_id || "—")}
          </div>

          {/* Dimensions */}
          {dims.length > 0 && (
            <div>
              <span className="font-space text-xs uppercase text-white/40 tracking-wider">Dimensions</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {dims.map(([k, v]) => (
                  <span key={k} className="bg-white/5 px-2 py-1 text-xs font-ibm-plex text-white/60">
                    {k}:{String(v)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Raw Payload */}
          <div>
            <div className="flex items-center gap-3">
              <span className="font-space text-xs uppercase text-white/40 tracking-wider">Raw Payload</span>
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="font-ibm-plex text-xs text-white/30 hover:text-white/60 transition-colors cursor-pointer"
              >
                {showRaw ? "− hide" : "+ show"}
              </button>
            </div>
            {showRaw && (
              <div className="bg-white/5 p-4 mt-2 font-ibm-plex text-xs text-white/50">
                <pre className="whitespace-pre-wrap">{JSON.stringify({
                  id: event.id,
                  event_type: event.event_type,
                  customer_id: event.customer_id,
                  timestamp: formatTimeParts(event.timestamp),
                  dimensions: event.properties,
                  fee: fee ? { amount: fee.amount, asset: fee.asset_code } : null,
                  status: event.status,
                }, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
