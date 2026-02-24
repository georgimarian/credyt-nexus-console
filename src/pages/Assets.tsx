import { useState } from "react";
import { TerminalCard } from "@/components/terminal/TerminalCard";
import { FieldLabel } from "@/components/terminal/FieldLabel";
import { StatusBadge } from "@/components/terminal/StatusBadge";
import { CopyableId } from "@/components/terminal/CopyableId";
import { assets } from "@/data/assets";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function Assets() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [quoteInput, setQuoteInput] = useState("10");
  const [quoteAsset] = useState("CREDITS");

  const creditsAsset = assets.find((a) => a.code === "CREDITS");
  const currentRate = creditsAsset?.rates[creditsAsset.rates.length - 1]?.rate || 100;
  const quoteResult = parseFloat(quoteInput || "0") * currentRate;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-space text-2xl font-bold uppercase tracking-wider mb-1">Assets</h1>
          <p className="font-ibm-plex text-sm text-muted-foreground">{assets.length} assets configured</p>
        </div>
        <button className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 font-space text-xs uppercase tracking-wide text-background transition-all duration-150 hover:bg-foreground/80">
          <Plus className="h-3.5 w-3.5" />
          New Asset
        </button>
      </div>

      <TerminalCard title="ASSET LIST">
        <Table>
          <TableHeader>
            <TableRow className="border-foreground/[0.06] hover:bg-transparent">
              <TableHead className="h-10 w-8 px-2"></TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Asset</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Code</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest">Type</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest text-center">Scale</TableHead>
              <TableHead className="h-10 px-4 font-space text-[10px] uppercase tracking-widest text-right">Symbol</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => (
              <>
                <TableRow
                  key={asset.id}
                  className="border-foreground/[0.04] cursor-pointer transition-all duration-150 hover:bg-accent/20"
                  onClick={() => setExpandedId(expandedId === asset.id ? null : asset.id)}
                >
                  <TableCell className="px-2 py-3">
                    {expandedId === asset.id
                      ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    }
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div>
                      <div className="font-ibm-plex text-sm font-medium">{asset.name}</div>
                      <div className="font-ibm-plex text-xs text-muted-foreground mt-0.5"># {asset.id}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 font-ibm-plex text-sm font-semibold">{asset.code}</TableCell>
                  <TableCell className="px-4 py-3">
                    <StatusBadge status={asset.type === "fiat" ? "active" : "draft"} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center font-ibm-plex text-sm">{asset.scale}</TableCell>
                  <TableCell className="px-4 py-3 text-right font-ibm-plex text-sm text-muted-foreground">{asset.symbol || "—"}</TableCell>
                </TableRow>

                {expandedId === asset.id && (
                  <TableRow key={`${asset.id}-detail`} className="hover:bg-transparent">
                    <TableCell colSpan={6} className="px-0 py-0">
                      <div className="bg-muted/10 px-6 py-5">
                        {asset.rates.length > 0 ? (
                          <div>
                            <div className="mb-3 font-space text-[10px] uppercase tracking-widest text-muted-foreground">Exchange Rates</div>
                            <Table>
                              <TableHeader>
                                <TableRow className="border-foreground/[0.06] hover:bg-transparent">
                                  <TableHead className="h-8 px-3 font-space text-[10px] uppercase tracking-wide">From</TableHead>
                                  <TableHead className="h-8 px-3 font-space text-[10px] uppercase tracking-wide">To</TableHead>
                                  <TableHead className="h-8 px-3 font-space text-[10px] uppercase tracking-wide">Rate</TableHead>
                                  <TableHead className="h-8 px-3 font-space text-[10px] uppercase tracking-wide">Effective</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {asset.rates.map((rate, i) => (
                                  <TableRow key={i} className="border-foreground/[0.04] transition-all duration-150 hover:bg-accent/20">
                                    <TableCell className="px-3 py-2 font-ibm-plex text-xs">{rate.from_asset}</TableCell>
                                    <TableCell className="px-3 py-2 font-ibm-plex text-xs">{rate.to_asset}</TableCell>
                                    <TableCell className="px-3 py-2 font-ibm-plex text-xs font-semibold">{rate.rate}</TableCell>
                                    <TableCell className="px-3 py-2 font-ibm-plex text-xs text-muted-foreground">
                                      {new Date(rate.effective_at).toLocaleDateString()}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="font-ibm-plex text-xs text-muted-foreground">Base fiat asset — no exchange rates</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </TerminalCard>

      <TerminalCard title="QUOTE CALCULATOR">
        <div className="flex flex-wrap items-end gap-6 font-ibm-plex text-sm">
          <div>
            <FieldLabel label="USD Amount" tooltip="Enter a USD amount to convert to credits at the current exchange rate." />
            <input
              type="number"
              value={quoteInput}
              onChange={(e) => setQuoteInput(e.target.value)}
              className="w-36 rounded-md border border-foreground/[0.12] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30"
            />
          </div>
          <div className="py-2 text-lg text-muted-foreground">→</div>
          <div>
            <FieldLabel label={quoteAsset} />
            <div className="w-36 rounded-md border border-foreground/[0.06] bg-muted/30 px-3 py-2 font-bold">
              {quoteResult.toFixed(0)}
            </div>
          </div>
          <div className="py-2 font-ibm-plex text-xs text-muted-foreground">
            Rate: 1 USD = {currentRate} {quoteAsset}
          </div>
        </div>
      </TerminalCard>
    </div>
  );
}
