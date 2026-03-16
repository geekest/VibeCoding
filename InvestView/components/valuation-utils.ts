export type ValuationZone = "buy" | "hold" | "sell";

export interface PercentileSnapshot {
  pePercentile3y: number;
  pePercentile5y: number;
  pePercentile10y: number;
}

/**
 * 综合判定思路：
 * - 主流估值框架通常会结合短中长期分位做加权（短期更敏感，长期更稳健）。
 * - 这里采用 3y/5y/10y = 0.4/0.35/0.25 的权重。
 * - 若出现双周期极端（<=20 或 >=80 至少两个周期同时触发），直接给出 buy/sell。
 */
export const getCompositePercentile = ({ pePercentile3y, pePercentile5y, pePercentile10y }: PercentileSnapshot): number => {
  return Number((pePercentile3y * 0.4 + pePercentile5y * 0.35 + pePercentile10y * 0.25).toFixed(1));
};

export const getValuationZone = (snapshot: PercentileSnapshot): ValuationZone => {
  const values = [snapshot.pePercentile3y, snapshot.pePercentile5y, snapshot.pePercentile10y];
  const buySignals = values.filter((value) => value < 20).length;
  if (buySignals >= 2) return "buy";

  const sellSignals = values.filter((value) => value > 80).length;
  if (sellSignals >= 2) return "sell";

  const composite = getCompositePercentile(snapshot);
  if (composite < 20) return "buy";
  if (composite > 80) return "sell";
  return "hold";
};

export const valuationZoneMap: Record<ValuationZone, { label: string; badge: string; card: string }> = {
  buy: {
    label: "买入/击球区",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/35",
    card: "border-emerald-500/50 bg-emerald-500/5",
  },
  hold: {
    label: "持有/观察区",
    badge: "bg-amber-500/15 text-amber-200 border-amber-500/35",
    card: "border-slate-700 bg-slate-900/60",
  },
  sell: {
    label: "卖出/警戒区",
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/35",
    card: "border-rose-500/50 bg-rose-500/5",
  },
};
