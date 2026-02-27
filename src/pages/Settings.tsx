import { useState } from "react";

export default function Settings() {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const apiKey = "sk_live_crdyt_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6";

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-10">
      {/* API KEY */}
      <div>
        <div className="font-mono text-xs text-white/50 border-b border-dotted border-white/20 pb-3 mb-4">┌─ API KEY ──────────────────────────┐</div>
        <div className="flex items-center gap-3">
          <div className="flex-1 border border-dotted border-white/[0.08] bg-white/5 px-3 py-2 font-mono text-sm">
            {showKey ? apiKey : "sk_live_crdyt_" + "•".repeat(32)}
          </div>
          <button onClick={() => setShowKey(!showKey)} className="flex h-9 w-9 items-center justify-center border border-dotted border-white/30 font-mono text-xs text-white hover:bg-white/5">{showKey ? "⊘" : "⊙"}</button>
          <button onClick={copyKey} className="flex h-9 w-9 items-center justify-center border border-dotted border-white/30 font-mono text-xs text-white hover:bg-white/5">{copied ? <span className="text-green-400">✓</span> : "⎘"}</button>
        </div>
        <p className="mt-2 font-mono text-xs text-white/40">⚠ Keep this key secret. Do not share it in client-side code.</p>
      </div>

      {/* Connected Accounts */}
      <div>
        <div className="font-mono text-xs text-white/50 border-b border-dotted border-white/20 pb-3 mb-4">┌─ CONNECTED ACCOUNTS ──────────────────────────┐</div>
        {[
          { name: "Stripe", id: "acct_1NqOXXXXXXXX" },
          { name: "OpenAI", id: "org-XXXXXXXX" },
        ].map((acct) => (
          <div key={acct.name} className="flex items-center justify-between py-3 border-b border-dotted border-white/10">
            <div className="font-mono text-sm">
              <span className="font-medium">{acct.name}</span>
              <span className="ml-2 text-xs text-white/40">{acct.id}</span>
            </div>
            <span className="inline-flex items-center gap-1.5 font-mono text-xs">
              <span className="flex h-4 w-4 items-center justify-center border border-green-400/60">
                <span className="text-[9px] leading-none text-green-400">✓</span>
              </span>
              <span className="text-white/60 uppercase">active</span>
            </span>
          </div>
        ))}
      </div>

      {/* Billing Portal */}
      <div>
        <div className="font-mono text-xs text-white/50 border-b border-dotted border-white/20 pb-3 mb-4">┌─ BILLING PORTAL ──────────────────────────┐</div>
        {[
          { label: "Portal URL", value: "https://billing.credyt.ai/portal/your-org" },
          { label: "Customization", value: "Default theme" },
          { label: "Self-service top-ups", value: "Enabled" },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between py-3 border-b border-dotted border-white/10 font-mono text-sm">
            <span className="text-white/40">{row.label}</span>
            <span className="text-xs">{row.value}</span>
          </div>
        ))}
      </div>

      {/* System Info */}
      <div>
        <div className="font-mono text-xs text-white/50 border-b border-dotted border-white/20 pb-3 mb-4">┌─ SYSTEM INFO ──────────────────────────┐</div>
        <pre className="font-mono text-xs text-white/40">
{`$ credyt version
credyt-admin v1.0.0
api: v1.0
region: us-east-1
status: ✓ ONLINE`}
        </pre>
      </div>
    </div>
  );
}
