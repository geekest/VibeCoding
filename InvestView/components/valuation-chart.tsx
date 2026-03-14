"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { IndexAsset } from "@/types/investment";

interface ValuationChartProps {
  asset: IndexAsset;
}

const quantile = (values: number[], q: number): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
};

export function ValuationChart({ asset }: ValuationChartProps) {
  const peSeries = asset.history.map((entry) => entry.peTtm);
  const buyPeLine = Number(quantile(peSeries, 0.2).toFixed(2));
  const sellPeLine = Number(quantile(peSeries, 0.8).toFixed(2));

  const chartData = asset.history.map((entry) => ({
    ...entry,
    buyPeLine,
    sellPeLine,
  }));

  return (
    <article className="rounded-xl border border-border bg-card/75 p-4 shadow-terminal">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-100">{asset.name} PE-TTM 趋势</h3>
        <p className="text-xs text-slate-400">{asset.symbol}</p>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 12, right: 12, left: -10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} minTickGap={14} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} width={42} domain={["auto", "auto"]} />
            <Tooltip
              cursor={{ stroke: "#64748b", strokeWidth: 1 }}
              contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: 8 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="buyPeLine" stroke="#10b981" strokeDasharray="8 4" dot={false} name="20% 买入线" />
            <Line type="monotone" dataKey="sellPeLine" stroke="#f43f5e" strokeDasharray="8 4" dot={false} name="80% 卖出线" />
            <Line type="monotone" dataKey="peTtm" stroke="#38bdf8" strokeWidth={2.2} dot={false} name="PE-TTM" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
