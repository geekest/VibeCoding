"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Clock3, RefreshCcw } from "lucide-react";
import { OverviewCard } from "@/components/overview-card";
import { ValuationChart } from "@/components/valuation-chart";
import { IndexAsset } from "@/types/investment";

interface ApiResponse {
  assets: IndexAsset[];
  source: "real-api" | "mock";
  message: string;
}

export function DashboardClient({ initialData }: { initialData: ApiResponse }) {
  const [data, setData] = useState<ApiResponse>(initialData);
  const [loading, setLoading] = useState(false);

  const sourceLabel = useMemo(() => {
    if (data.source === "real-api") return "指数 API 实时数据";
    return "Mock 数据（API 不可用时兜底）";
  }, [data.source]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/index-valuation", { cache: "no-store" });
      const nextData = (await res.json()) as ApiResponse;
      setData(nextData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      refreshData().catch(() => undefined);
    }, 1000 * 60 * 15);

    return () => clearInterval(timer);
  }, []);

  return (
    <main className="grid-pattern min-h-screen px-4 py-8 text-slate-100 md:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="rounded-2xl border border-border bg-card/70 p-6 shadow-terminal">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold md:text-3xl">InvestView 个人投资看板</h1>
              <p className="mt-2 text-sm text-slate-400 md:text-base">网页端直接调用指数 API，持续追踪最新估值状态。</p>
            </div>
            <div className="space-y-2 text-sm text-slate-300">
              <p className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-300" /> 覆盖市场：美股 / A股 / 港股
              </p>
              <p className="flex items-center gap-2 text-xs text-slate-400">
                <Clock3 className="h-4 w-4" /> 数据源：{sourceLabel}
              </p>
              <button
                type="button"
                onClick={() => refreshData().catch(() => undefined)}
                className="inline-flex items-center gap-2 rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-300 transition hover:border-cyan-400 hover:text-cyan-200"
                disabled={loading}
              >
                <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                {loading ? "刷新中" : "立即刷新"}
              </button>
            </div>
          </div>
          {data.source === "mock" && (
            <p className="mt-4 flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              <AlertTriangle className="h-4 w-4" /> {data.message}
            </p>
          )}
        </header>

        <section>
          <h2 className="mb-4 text-lg font-semibold">全局估值状态</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {data.assets.map((asset) => (
              <OverviewCard key={asset.id} asset={asset} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">历史估值趋势（PE-TTM）</h2>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {data.assets.map((asset) => (
              <ValuationChart key={`${asset.id}-chart`} asset={asset} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
