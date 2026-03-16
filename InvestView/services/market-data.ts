import { IndexAsset, MarketDataProvider, MarketRegion, PeHistoryPoint } from "@/types/investment";

interface DanjuanIndexItem {
  code: string;
  name: string;
  pe?: number;
  pe_percentile?: number;
  pb?: number;
  pb_percentile?: number;
  date?: string;
}

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
  pePercentile: number,
  history: PeHistoryPoint[],
): IndexAsset => ({
  id,
  name,
  symbol,
  region,
  price,
  dailyChangePct,
  peTtm,
  pePercentile,
  history,
  updatedAt: new Date().toISOString(),
});

const mockAssets: IndexAsset[] = [
  createAsset("sp500", "标普500", "SPX", "US", 5182.34, 0.45, 23.6, 67, buildHistory(20, 4, 0.11)),
  createAsset("nasdaq100", "纳斯达克100", "NDX", "US", 18412.8, -0.34, 31.8, 76, buildHistory(25, 6, 0.09)),
  createAsset("csi300", "沪深300", "000300.SH", "CN", 3564.2, 0.14, 11.7, 23, buildHistory(13, 2.3, -0.03)),
  createAsset("csi500", "中证500", "000905.SH", "CN", 5421.9, -0.58, 18.4, 41, buildHistory(19, 2.8, -0.02)),
  createAsset("chinext", "创业板指", "399006.SZ", "CN", 1987.43, 0.78, 42.9, 88, buildHistory(34, 5.8, 0.18)),
  createAsset("hstech", "恒生科技", "HSTECH", "HK", 3842.6, 1.42, 14.2, 17, buildHistory(16, 3.6, -0.05)),
  createAsset("dividend-lowvol", "红利低波", "H30269", "DEFENSIVE", 4531.2, 0.21, 9.8, 32, buildHistory(11, 1.2, -0.01)),
  createAsset("gold-etf", "黄金ETF", "518880.SH", "DEFENSIVE", 4.82, -0.08, 20.1, 54, buildHistory(18, 2.1, 0.04)),
];

class MockMarketDataProvider implements MarketDataProvider {
  async fetchOverview(): Promise<IndexAsset[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockAssets), 240);
    });
  }
}

const trackedIndexes = [
  { id: "csi300", symbol: "000300.SH", code: "SH000300", region: "CN" as const },
  { id: "csi500", symbol: "000905.SH", code: "SH000905", region: "CN" as const },
  { id: "chinext", symbol: "399006.SZ", code: "SZ399006", region: "CN" as const },
  { id: "sp500", symbol: "SPX", code: "SP500", region: "US" as const },
  { id: "nasdaq100", symbol: "NDX", code: "NDX", region: "US" as const },
  { id: "hstech", symbol: "HSTECH", code: "HSTECH", region: "HK" as const },
];

const defaultApiUrl = "https://danjuanfunds.com/djapi/index_eva/dj";

const buildHistoryFromLatestPe = (peTtm: number): PeHistoryPoint[] => {
  const fallback = buildHistory(peTtm, Math.max(peTtm * 0.12, 1.2), -0.02);
  return fallback.map((item, index) => {
    if (index === fallback.length - 1) {
      return { ...item, peTtm: Number(peTtm.toFixed(2)) };
    }
    return item;
  });
};

class RealMarketDataProvider implements MarketDataProvider {
  async fetchOverview(): Promise<IndexAsset[]> {
    const apiUrl = process.env.INDEX_VALUATION_API_URL || defaultApiUrl;
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://danjuanfunds.com/",
      },
      next: { revalidate: 900 },
    });

    if (!response.ok) {
      throw new Error(`指数 API 请求失败: ${response.status}`);
    }

    const payload = (await response.json()) as
      | { data?: { items?: DanjuanIndexItem[]; all_indexes?: DanjuanIndexItem[] } }
      | DanjuanIndexItem[];

    const list = Array.isArray(payload)
      ? payload
      : payload.data?.items || payload.data?.all_indexes || [];

    if (!list.length) {
      throw new Error("指数 API 返回为空");
    }

    const byCode = new Map(list.map((item) => [item.code, item]));

    const merged = trackedIndexes
      .map((indexItem) => {
        const latest = byCode.get(indexItem.code);
        if (!latest) return null;

        const peValue = latest.pe ?? latest.pb ?? 0;
        const percentileRaw = latest.pe_percentile ?? latest.pb_percentile ?? 0;
        const pePercentile = Number((percentileRaw * 100).toFixed(0));

        return createAsset(
          indexItem.id,
          latest.name || indexItem.id,
          indexItem.symbol,
          indexItem.region,
          0,
          0,
          Number(peValue.toFixed(2)),
          pePercentile,
          buildHistoryFromLatestPe(peValue),
        );
      })
      .filter((item): item is IndexAsset => item !== null);

    if (!merged.length) {
      throw new Error("未匹配到任何目标指数");
    }

    return merged;
  }
}

class SafeMarketDataProvider implements MarketDataProvider {
  private readonly realProvider = new RealMarketDataProvider();
  private readonly mockProvider = new MockMarketDataProvider();

  async fetchOverview(): Promise<IndexAsset[]> {
    try {
      return await this.realProvider.fetchOverview();
    } catch {
      return this.mockProvider.fetchOverview();
    }
  }
}

export const marketDataService = new SafeMarketDataProvider();
