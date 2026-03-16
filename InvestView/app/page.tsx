import { Activity, Clock3 } from "lucide-react";
import { OverviewCard } from "@/components/overview-card";
import { ValuationChart } from "@/components/valuation-chart";
import { marketDataService } from "@/services/market-data";

export default async function HomePage() {
  const assets = await marketDataService.fetchOverview();

  return (
    <main className="grid-pattern min-h-screen px-4 py-8 text-slate-100 md:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="rounded-2xl border border-border bg-card/70 p-6 shadow-terminal">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold md:text-3xl">InvestView 个人投资看板</h1>
              <p className="mt-2 text-sm text-slate-400 md:text-base">
                实时追踪核心指数估值与 PE-TTM 分位，服务“低买高卖”的估值轮动策略。
              </p>
            </div>
            <div className="space-y-2 text-sm text-slate-300">
              <p className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-300" /> 覆盖市场：美股 / A股 / 港股 / 防御资产
              </p>
              <p className="flex items-center gap-2 text-xs text-slate-400">
                <Clock3 className="h-4 w-4" /> 数据源：Mock Provider（可替换为真实 API）
              </p>
            </div>
          </div>
        </header>

        <section>
          <h2 className="mb-4 text-lg font-semibold">全局估值状态</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {assets.map((asset) => (
              <OverviewCard key={asset.id} asset={asset} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">历史估值趋势（PE-TTM）</h2>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {assets.map((asset) => (
              <ValuationChart key={`${asset.id}-chart`} asset={asset} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
