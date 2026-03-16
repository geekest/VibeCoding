import { mockIndexes } from '@/lib/mockData';
import { DashboardResponse, IndexData, Zone } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_MARKET_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_MARKET_API_KEY;

const buildZone = (percentile: number): Zone => {
  if (percentile < 30) {
    return 'buy';
  }

  if (percentile >= 75) {
    return 'sell';
  }

  return 'hold';
};

const normalizeIndexes = (raw: IndexData[]): IndexData[] =>
  raw.map((item) => ({
    ...item,
    zone: buildZone(item.pePercentiles.y10)
  }));

const fetchFromProvider = async (): Promise<IndexData[] | null> => {
  if (!API_BASE_URL || !API_KEY) {
    return null;
  }

  try {
    // TODO: 在这里替换为真实供应商接口（iTick/Finnhub/Alpha Vantage）。
    // 例如：`${API_BASE_URL}/dashboard?symbols=SPX,NDX,...`。
    const response = await fetch(`${API_BASE_URL}/dashboard`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`
      },
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { indexes: IndexData[] };
    return normalizeIndexes(data.indexes);
  } catch (error) {
    console.warn('实时接口请求失败，已切换到 Mock 数据:', error);
    return null;
  }
};

export const getDashboardData = async (): Promise<DashboardResponse> => {
  const liveData = await fetchFromProvider();

  if (liveData) {
    return {
      source: 'api',
      indexes: liveData
    };
  }

  return {
    source: 'mock',
    indexes: normalizeIndexes(mockIndexes)
  };
};
