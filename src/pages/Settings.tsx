import { useState } from "react";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { Eye, EyeOff, Copy, Check } from "lucide-react";

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
    <div className="space-y-6">
      <div>
        <h1 className="font-space text-2xl font-bold uppercase tracking-wide">$ settings</h1>
        <p className="font-ibm-plex text-sm text-muted-foreground">configuration & api access</p>
      </div>

      {/* API Key */}
      <TerminalCard title="API KEY">
        <div className="flex items-center gap-3">
          <div className="flex-1 border border-dashed border-foreground/15 bg-muted/50 px-3 py-2 font-ibm-plex text-sm">
            {showKey ? apiKey : "sk_live_crdyt_" + "•".repeat(32)}
          </div>
          <button
            onClick={() => setShowKey(!showKey)}
            className="flex h-9 w-9 items-center justify-center border border-dashed border-foreground/30 transition-colors hover:bg-foreground hover:text-background"
            aria-label={showKey ? "Hide API key" : "Show API key"}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            onClick={copyKey}
            className="flex h-9 w-9 items-center justify-center border border-dashed border-foreground/30 transition-colors hover:bg-foreground hover:text-background"
            aria-label="Copy API key"
          >
            {copied ? <Check className="h-4 w-4 text-terminal-green" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-2 font-ibm-plex text-xs text-muted-foreground">
          ⚠ Keep this key secret. Do not share it in client-side code.
        </p>
      </TerminalCard>

      {/* Connected Accounts */}
      <TerminalCard title="CONNECTED ACCOUNTS">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-dashed border-foreground/10 py-3">
            <div className="font-ibm-plex text-sm">
              <span className="font-bold">Stripe</span>
              <span className="ml-2 text-xs text-muted-foreground">acct_1NqOXXXXXXXX</span>
            </div>
            <StatusBadge status="active" />
          </div>
          <div className="flex items-center justify-between border-b border-dashed border-foreground/10 py-3">
            <div className="font-ibm-plex text-sm">
              <span className="font-bold">OpenAI</span>
              <span className="ml-2 text-xs text-muted-foreground">org-XXXXXXXX</span>
            </div>
            <StatusBadge status="active" />
          </div>
        </div>
      </TerminalCard>

      {/* Billing Portal */}
      <TerminalCard title="BILLING PORTAL">
        <div className="space-y-3 font-ibm-plex text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Portal URL</span>
            <span className="text-xs">https://billing.credyt.ai/portal/your-org</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Customization</span>
            <span className="text-xs">Default theme</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Self-service top-ups</span>
            <StatusBadge status="active" />
          </div>
        </div>
      </TerminalCard>

      {/* Terminal Info */}
      <TerminalCard title="SYSTEM INFO">
        <pre className="font-ibm-plex text-xs text-muted-foreground">
{`$ credyt version
credyt-admin v1.0.0
api: v1.0
region: us-east-1
status: ✓ ONLINE`}
        </pre>
      </TerminalCard>
    </div>
  );
}
