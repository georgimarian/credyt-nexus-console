import { useState } from "react";
import { SettingsLayout } from "@/components/settings/SettingsLayout";

export default function Settings() {
  const [companyName, setCompanyName] = useState("Geourney");
  const [websiteUrl, setWebsiteUrl] = useState("http://example.com");
  const [timezone, setTimezone] = useState("UTC");
  const [selfServiceTopups, setSelfServiceTopups] = useState(true);

  return (
    <SettingsLayout>
      {/* COMPANY PROFILE */}
      <div className="font-mono text-xs text-white/50 mb-4">
        ┌─ COMPANY PROFILE ───────────────────────────────────────────┐
      </div>

      {/* Icon row */}
      <div className="flex items-start gap-6 py-5 border-b border-dotted border-white/15">
        <div className="w-16 h-16 border border-dotted border-white/20 bg-white/5 flex items-center justify-center shrink-0">
          <span className="text-white/20 text-xs font-mono">GE</span>
        </div>
        <div className="flex flex-col gap-2">
          <button className="border border-dotted border-white/20 text-white/50 text-xs font-mono px-3 py-1.5 hover:border-white/40 transition-colors">
            UPLOAD ICON
          </button>
          <span className="text-xs text-white/20 font-mono mt-1">Maximum size 2 MB · PNG, JPG, SVG</span>
        </div>
      </div>

      {/* Company Name */}
      <div className="flex justify-between items-center py-4 border-b border-dotted border-white/15">
        <span className="text-xs text-white/50 font-mono uppercase tracking-wide">Company Name</span>
        <input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="bg-transparent border-b border-dotted border-white/20 text-sm font-mono text-white px-2 py-1 w-64 focus:border-white/50 outline-none text-right"
        />
      </div>

      {/* Website URL */}
      <div className="flex justify-between items-center py-4 border-b border-dotted border-white/15">
        <span className="text-xs text-white/50 font-mono uppercase tracking-wide">Website URL</span>
        <input
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          className="bg-transparent border-b border-dotted border-white/20 text-sm font-mono text-white px-2 py-1 w-64 focus:border-white/50 outline-none text-right"
        />
      </div>

      {/* Timezone */}
      <div className="flex justify-between items-center py-4 border-b border-dotted border-white/15">
        <span className="text-xs text-white/50 font-mono uppercase tracking-wide">Timezone</span>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="bg-transparent border-b border-dotted border-white/20 text-sm font-mono text-white px-2 py-1 w-64 focus:border-white/50 outline-none text-right appearance-none cursor-pointer"
        >
          <option value="UTC" className="bg-[#030712]">UTC</option>
          <option value="US/Eastern" className="bg-[#030712]">US/Eastern</option>
          <option value="US/Pacific" className="bg-[#030712]">US/Pacific</option>
          <option value="Europe/London" className="bg-[#030712]">Europe/London</option>
          <option value="Europe/Berlin" className="bg-[#030712]">Europe/Berlin</option>
          <option value="Asia/Tokyo" className="bg-[#030712]">Asia/Tokyo</option>
        </select>
      </div>

      <button className="bg-white text-black px-4 py-2 text-xs font-mono uppercase tracking-wide mt-6 hover:bg-white/90 transition-colors">
        Save Changes →
      </button>

      {/* BILLING PORTAL */}
      <div className="font-mono text-xs text-white/50 mb-4 mt-10">
        ┌─ BILLING PORTAL ────────────────────────────────────────────┐
      </div>

      <div className="flex justify-between items-center py-4 border-b border-dotted border-white/15">
        <span className="text-xs text-white/50 font-mono uppercase tracking-wide">Portal URL</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-white/70">https://billing.credyt.ai/portal/your-org</span>
          <button
            onClick={() => navigator.clipboard.writeText("https://billing.credyt.ai/portal/your-org")}
            className="text-white/30 hover:text-white/70 text-xs transition-colors"
          >
            ⧉
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center py-4 border-b border-dotted border-white/15">
        <span className="text-xs text-white/50 font-mono uppercase tracking-wide">Customization</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-white/70">Default theme</span>
          <button className="border border-dotted border-white/20 text-white/40 text-xs font-mono px-3 py-1 hover:border-white/40 transition-colors">
            CUSTOMIZE →
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center py-4 border-b border-dotted border-white/15">
        <span className="text-xs text-white/50 font-mono uppercase tracking-wide">Self-service top-ups</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-white/70">{selfServiceTopups ? "Enabled" : "Disabled"}</span>
          <button
            onClick={() => setSelfServiceTopups(!selfServiceTopups)}
            className={`w-10 h-5 relative transition-colors ${selfServiceTopups ? "bg-green-400" : "bg-white/20"}`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-black transition-transform ${selfServiceTopups ? "left-[22px]" : "left-0.5"}`}
            />
          </button>
        </div>
      </div>

      {/* SYSTEM INFO */}
      <div className="font-mono text-xs text-white/50 mb-4 mt-10">
        ┌─ SYSTEM INFO ───────────────────────────────────────────────┐
      </div>

      <div className="bg-black/30 border border-dotted border-white/15 p-4 font-mono text-xs text-green-400/80">
        <pre>{`$ credyt version
credyt-admin v1.0.0
api: v1.0
region: us-east-1
status: ✓ ONLINE`}</pre>
      </div>
    </SettingsLayout>
  );
}
