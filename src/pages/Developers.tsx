import { useState } from "react";
import { SettingsLayout } from "@/components/settings/SettingsLayout";

export default function Developers() {
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const apiKey = "sk_live_crdyt_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6";
  const accountId = "acc_4v6twevjcg8vc0bzhc4jz12dwm";
  const primaryKey = "key_test_kA3bX7mPqR2sT5uW8yZ0cE4fG6hJ9EZbQ";
  const secondaryKey = "key_test_zB1cD3eF5gH7iJ9kL0mN2oP4qR6sT8jYa6w";

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maskKey = (key: string) => {
    const prefix = key.slice(0, key.indexOf("_", key.indexOf("_") + 1) + 2);
    return prefix + "••••••••••••••••••••••••••••";
  };

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className="text-white/30 hover:text-white/70 text-xs transition-colors ml-2"
    >
      {copiedKey === id ? <span className="text-green-400">✓</span> : "⧉"}
    </button>
  );

  return (
    <SettingsLayout>
      {/* API KEY */}
      <div className="font-mono text-xs text-white/50 mb-4">
        ┌─ API KEY ────────────────────────────────────────────────────┐
      </div>

      <div className="flex items-center gap-3 py-4 border-b border-dotted border-white/15">
        <div className="flex-1 bg-black/30 border border-dotted border-white/20 px-4 py-2.5 font-mono text-sm text-white/70">
          {showKey ? apiKey : "sk_live_crdyt_••••••••••••••••••••••••••••"}
        </div>
        <button
          onClick={() => setShowKey(!showKey)}
          className="border border-dotted border-white/20 px-3 py-2 text-white/40 hover:text-white transition-colors font-mono text-sm"
        >
          {showKey ? "⊘" : "👁"}
        </button>
        <button
          onClick={() => copyToClipboard(apiKey, "api")}
          className="border border-dotted border-white/20 px-3 py-2 text-white/40 hover:text-white transition-colors font-mono text-sm"
        >
          {copiedKey === "api" ? <span className="text-green-400">✓</span> : "⧉"}
        </button>
      </div>
      <p className="text-xs text-amber-400/60 font-mono mt-2">
        ⚠ Keep this key secret. Do not share it in client-side code.
      </p>

      {/* CONNECTED ACCOUNTS */}
      <div className="font-mono text-xs text-white/50 mb-4 mt-10">
        ┌─ CONNECTED ACCOUNTS ────────────────────────────────────────┐
      </div>

      {[
        { name: "Stripe", id: "acct_1NqDXXXXXXXX" },
        { name: "OpenAI", id: "org-XXXXXXXX" },
      ].map((acct) => (
        <div key={acct.name} className="flex items-center justify-between py-4 border-b border-dotted border-white/15">
          <div className="font-mono text-sm">
            <span className="font-bold">{acct.name}</span>
            <span className="ml-2 text-xs text-white/30">{acct.id}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs">
              <span className="flex h-4 w-4 items-center justify-center border border-green-400/60">
                <span className="text-[9px] leading-none text-green-400">✓</span>
              </span>
              <span className="text-white/60 uppercase">Active</span>
            </span>
            <button className="border border-dotted border-white/20 text-white/40 text-xs font-mono px-3 py-1 hover:border-white/40 transition-colors">
              CONFIGURE →
            </button>
          </div>
        </div>
      ))}

      <button className="border border-dotted border-white/20 text-white/40 text-xs font-mono px-4 py-2 mt-3 hover:border-white/40 transition-colors">
        + CONNECT NEW INTEGRATION
      </button>

      {/* API KEYS */}
      <div className="font-mono text-xs text-white/50 mb-4 mt-10">
        ┌─ API KEYS ──────────────────────────────────────────────────┐
      </div>

      <div className="flex justify-between items-center py-4 border-b border-dotted border-white/15">
        <span className="text-xs text-white/50 font-mono uppercase tracking-wide">Account ID</span>
        <div className="flex items-center">
          <span className="text-sm font-mono text-white/70">{accountId.slice(0, 8)}...{accountId.slice(-6)}</span>
          <CopyBtn text={accountId} id="acct" />
        </div>
      </div>

      <div className="flex justify-between items-center py-4 border-b border-dotted border-white/15">
        <span className="text-xs text-white/50 font-mono uppercase tracking-wide">Environment</span>
        <span className="border border-dotted border-amber-400/40 text-amber-400 text-xs px-2 py-0.5 font-mono">
          test
        </span>
      </div>

      <div className="flex justify-between items-center py-4 border-b border-dotted border-white/15">
        <span className="text-xs text-white/50 font-mono uppercase tracking-wide">Primary Key</span>
        <div className="flex items-center">
          <span className="text-sm font-mono text-white/70">key_test_k...9EZbQ</span>
          <CopyBtn text={primaryKey} id="primary" />
        </div>
      </div>

      <div className="flex justify-between items-center py-4 border-b border-dotted border-white/15">
        <span className="text-xs text-white/50 font-mono uppercase tracking-wide">Secondary Key</span>
        <div className="flex items-center">
          <span className="text-sm font-mono text-white/70">key_test_z...jYa6w</span>
          <CopyBtn text={secondaryKey} id="secondary" />
        </div>
      </div>
    </SettingsLayout>
  );
}
