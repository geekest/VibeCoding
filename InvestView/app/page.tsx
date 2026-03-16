import { DashboardClient } from "@/components/dashboard-client";
import { marketDataService } from "@/services/market-data";

export default async function HomePage() {
  const assets = await marketDataService.fetchOverview();
  const source = assets.every((item) => item.price === 0 && item.dailyChangePct === 0) ? "real-api" : "mock";

  return (
    <DashboardClient
      initialData={{
        assets,
        source,
        message:
          source === "real-api"
            ? "已从指数 API 获取最新估值数据。"
            : "指数 API 当前不可达，已自动回退到本地 Mock 数据。",
      }}
    />
  );
}
