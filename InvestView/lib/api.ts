import { mockIndexes } from '@/lib/mockData';
import { DashboardResponse, IndexData, Zone } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_MARKET_API_BASE_URL || 'https://www.alphavantage.co/query';
const API_KEY = process.env.NEXT_PUBLIC_MARKET_API_KEY || '2DSXBV4RAMYHNIUR';

const alphaSymbolMap: Partial<Record<IndexData['id'], string>> = {
  sp500: 'SPY',
  nasdaq100: 'QQQ',
  nikkei225: 'EWJ',
  smh: 'SMH',
  gold-etf: 'GLD'
};

interface AlphaQuote {
  '05. price'?: string;
  '10. change percent'?: string;
}

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

const fetchAlphaQuote = async (symbol: string): Promise<AlphaQuote | null> => {
  try {
    const url = `${API_BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`;
    const response = await fetch(url, { next: { revalidate: 300 } });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { 'Global Quote'?: AlphaQuote };
    return data['Global Quote'] ?? null;
  } catch (error) {
    console.warn(`Alpha Vantage 拉取 ${symbol} 失败:`, error);
    return null;
  }
};

const mergeAlphaData = async (base: IndexData[]): Promise<IndexData[] | null> => {
  if (!API_KEY) {
    return null;
  }

  const merged = [...base];
  let hasLiveValue = false;

  for (const [id, alphaSymbol] of Object.entries(alphaSymbolMap)) {
    const quote = await fetchAlphaQuote(alphaSymbol as string);

    if (!quote?.['05. price']) {
      continue;
    }

    const target = merged.find((item) => item.id === id);

    if (!target) {
      continue;
    }

    const livePrice = Number.parseFloat(quote['05. price']);
    const changePercent = Number.parseFloat((quote['10. change percent'] ?? '0').replace('%', ''));

    if (!Number.isNaN(livePrice)) {
      target.latestPrice = Number(livePrice.toFixed(2));
      target.updatedAt = new Date().toISOString();
      hasLiveValue = true;
    }

    if (!Number.isNaN(changePercent)) {
      target.returns.d1 = Number(changePercent.toFixed(2));
    }
  }

  return hasLiveValue ? normalizeIndexes(merged) : null;
};

export const getDashboardData = async (): Promise<DashboardResponse> => {
  const liveData = await mergeAlphaData(normalizeIndexes(mockIndexes));

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
