export type ValuationZone = "buy" | "hold" | "sell";

export const getValuationZone = (percentile: number): ValuationZone => {
  if (percentile < 20) return "buy";
  if (percentile > 80) return "sell";
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
