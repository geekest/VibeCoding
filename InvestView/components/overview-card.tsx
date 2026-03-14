import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { IndexAsset } from "@/types/investment";
import { getValuationZone, valuationZoneMap } from "@/components/valuation-utils";

interface OverviewCardProps {
  asset: IndexAsset;
}

export function OverviewCard({ asset }: OverviewCardProps) {
  const zone = getValuationZone(asset.pePercentile);
  const zoneStyle = valuationZoneMap[zone];
  const isUp = asset.dailyChangePct >= 0;

  return (
    <article className={`rounded-xl border p-4 shadow-terminal transition ${zoneStyle.card}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{asset.symbol}</p>
          <h2 className="text-lg font-semibold text-slate-100">{asset.name}</h2>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs ${zoneStyle.badge}`}>{zoneStyle.label}</span>
      </div>

      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-400">当前价格</dt>
          <dd className="font-medium text-slate-100">{asset.price.toLocaleString()}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-400">日内涨跌</dt>
          <dd className={`flex items-center gap-1 font-medium ${isUp ? "text-emerald-300" : "text-rose-300"}`}>
            {isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {asset.dailyChangePct.toFixed(2)}%
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-400">PE-TTM</dt>
          <dd className="font-medium text-slate-100">{asset.peTtm.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-400">10年分位</dt>
          <dd className="font-medium text-slate-100">{asset.pePercentile}%</dd>
        </div>
      </dl>
    </article>
  );
}
