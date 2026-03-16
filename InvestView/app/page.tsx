import { Clock3, Database, LineChart } from 'lucide-react';
import { IndexCard } from '@/components/IndexCard';
import { PeChart } from '@/components/PeChart';
import { getDashboardData } from '@/lib/api';

export default async function HomePage() {
  const dashboard = await getDashboardData();

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 md:px-8">
      <section className="mb-6 rounded-3xl bg-gradient-to-r from-cyan-800 via-cyan-700 to-teal-700 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
              <Database size={14} /> 数据源：{dashboard.source === 'api' ? '实时接口' : 'Mock 回退'}
            </p>
            <h1 className="text-3xl font-bold">InvestView 个人投资估值看板</h1>
            <p className="mt-2 text-sm text-cyan-50">覆盖美股、A股、港股、防御资产与黄金ETF，聚焦PE-TTM与历史分位轮动。</p>
          </div>
          <p className="inline-flex items-center gap-2 text-sm text-cyan-50">
            <Clock3 size={14} /> 更新频率：5分钟轮询（可配置）
          </p>
        </div>
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboard.indexes.map((indexData) => (
          <IndexCard key={indexData.id} data={indexData} />
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <LineChart size={18} className="text-cyan-700" />
          <h2 className="text-xl font-semibold">核心指数历史估值趋势图</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {dashboard.indexes.map((item) => (
            <PeChart key={item.id} title={item.name} history={item.history} />
          ))}
        </div>
      </section>
    </main>
  );
}
