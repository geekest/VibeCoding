import { IndexAsset, MarketDataProvider, MarketRegion, PeHistoryPoint } from "@/types/investment";

const buildHistory = (base: number, amplitude: number, trend: number): PeHistoryPoint[] => {
  return Array.from({ length: 24 }).map((_, idx) => {
    const month = idx + 1;
    const oscillation = Math.sin(month / 2.7) * amplitude;
    return {
      date: `202${Math.floor(idx / 12) + 4}-${String((idx % 12) + 1).padStart(2, "0")}`,
      peTtm: Number((base + oscillation + trend * idx).toFixed(2)),
    };
  });
};

const createAsset = (
  id: string,
  name: string,
  symbol: string,
  region: MarketRegion,
  price: number,
  dailyChangePct: number,
  peTtm: number,
  pePercentile3y: number,
  pePercentile5y: number,
  pePercentile10y: number,
  history: PeHistoryPoint[],
): IndexAsset => ({
  id,
  name,
  symbol,
  region,
  price,
  dailyChangePct,
  peTtm,
  pePercentile3y,
  pePercentile5y,
  pePercentile10y,
  history,
  updatedAt: new Date().toISOString(),
});

const mockAssets: IndexAsset[] = [
  createAsset("sp500", "标普500", "SPX", "US", 5182.34, 0.45, 23.6, 69, 68, 67, buildHistory(20, 4, 0.11)),
  createAsset("nasdaq100", "纳斯达克100", "NDX", "US", 18412.8, -0.34, 31.8, 79, 77, 76, buildHistory(25, 6, 0.09)),
  createAsset("csi300", "沪深300", "000300.SH", "CN", 3564.2, 0.14, 11.7, 21, 22, 23, buildHistory(13, 2.3, -0.03)),
  createAsset("csi500", "中证500", "000905.SH", "CN", 5421.9, -0.58, 18.4, 38, 40, 41, buildHistory(19, 2.8, -0.02)),
  createAsset("chinext", "创业板指", "399006.SZ", "CN", 1987.43, 0.78, 42.9, 91, 89, 88, buildHistory(34, 5.8, 0.18)),
  createAsset("hstech", "恒生科技", "HSTECH", "HK", 3842.6, 1.42, 14.2, 16, 17, 17, buildHistory(16, 3.6, -0.05)),
  createAsset(
    "husheng-hk-dividend-growth-lowvol",
    "沪港深红利成长低波指数",
    "931091.CSI",
    "CN",
    2187.54,
    0.32,
    12.6,
    27,
    28,
    29,
    buildHistory(13, 1.9, 0.02),
  ),
  createAsset(
    "dfrh-csi-dividend-lowvol",
    "东方红中证红利低波指数",
    "931065.CSI",
    "CN",
    1965.37,
    -0.11,
    10.9,
    24,
    25,
    26,
    buildHistory(11.5, 1.6, 0.01),
  ),
  createAsset("dividend-lowvol", "红利低波", "H30269", "DEFENSIVE", 4531.2, 0.21, 9.8, 30, 31, 32, buildHistory(11, 1.2, -0.01)),
  createAsset("gold-etf", "黄金ETF", "518880.SH", "DEFENSIVE", 4.82, -0.08, 20.1, 52, 53, 54, buildHistory(18, 2.1, 0.04)),
];

class MockMarketDataProvider implements MarketDataProvider {
  async fetchOverview(): Promise<IndexAsset[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockAssets), 240);
    });
  }
}

export const marketDataService = new MockMarketDataProvider();

/**
 * TODO: 接入真实数据源时可替换为 HTTP Provider：
 * 1. 在 .env.local 中配置 API Key（例如 FINNHUB_API_KEY / ALPHA_VANTAGE_API_KEY）。
 * 2. 在此文件创建 RealMarketDataProvider，通过 fetch 调用服务商 API。
 * 3. 将导出的 service 从 Mock provider 切换到 Real provider。
 */
