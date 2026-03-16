import { mockIndexes } from '@/lib/mockData';
import { DashboardResponse, IndexData, Zone } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_MARKET_API_BASE_URL || 'https://www.alphavantage.co/query';
const API_KEY = process.env.NEXT_PUBLIC_MARKET_API_KEY || '2DSXBV4RAMYHNIUR';
const SCHEDULE_WINDOW_MS = 5 * 60 * 1000;

const alphaSymbolMap: Partial<Record<IndexData['id'], string>> = {
  sp500: 'SPY',
  nasdaq100: 'QQQ',
  nikkei225: 'EWJ',
  smh: 'SMH',
  gold-etf: 'GLD',
  ftse100: 'ISF.L'
};

interface AlphaQuote {
  '05. price'?: string;
  '10. change percent'?: string;
}

interface LiveQuoteCache {
  price: number;
  changePercent: number;
  updatedAt: string;
}

const liveQuoteCache = new Map<string, LiveQuoteCache>();

const buildZone = (percentile: number): Zone => {
  if (percentile < 30) {
    return 'buy';
  }

  if (percentile >= 75) {
    return 'sell';
  }

  return 'hold';
};

const createEmptyIndexes = (): IndexData[] =>
  mockIndexes.map((item) => ({
    ...item,
    latestPrice: Number.NaN,
    peTtm: Number.NaN,
    peFwd: Number.NaN,
    pbTtm: Number.NaN,
    peg: Number.NaN,
    pePercentiles: { y3: Number.NaN, y5: Number.NaN, y10: Number.NaN },
    returns: { d1: Number.NaN, w1: Number.NaN, m1: Number.NaN, m3: Number.NaN, m6: Number.NaN, y1: Number.NaN, y2: Number.NaN, y5: Number.NaN },
    peChanges: { m3: Number.NaN, m6: Number.NaN, y1: Number.NaN },
    history: item.history.map((point) => ({ ...point, pe: Number.NaN, percentile: Number.NaN }))
  }));

const normalizeIndexes = (raw: IndexData[]): IndexData[] =>
  raw.map((item) => ({
    ...item,
    zone: Number.isFinite(item.pePercentiles.y10) ? buildZone(item.pePercentiles.y10) : 'hold'
  }));

const fetchAlphaQuote = async (symbol: string): Promise<AlphaQuote | null> => {
  if (!API_KEY) {
    return null;
  }

  try {
    const url = `${API_BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`;
    const response = await fetch(url, { next: { revalidate: 15 } });

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

const updateSingleQuoteBySchedule = async (): Promise<void> => {
  const entries = Object.entries(alphaSymbolMap);

  if (entries.length === 0) {
    return;
  }

  const slotMs = Math.max(15_000, Math.floor(SCHEDULE_WINDOW_MS / entries.length));
  const slot = Math.floor(Date.now() / slotMs) % entries.length;
  const [id, symbol] = entries[slot];

  const quote = await fetchAlphaQuote(symbol as string);

  if (!quote?.['05. price']) {
    return;
  }

  const livePrice = Number.parseFloat(quote['05. price']);
  const changePercent = Number.parseFloat((quote['10. change percent'] ?? '0').replace('%', ''));

  if (!Number.isFinite(livePrice)) {
    return;
  }

  liveQuoteCache.set(id, {
    price: Number(livePrice.toFixed(2)),
    changePercent: Number.isFinite(changePercent) ? Number(changePercent.toFixed(2)) : Number.NaN,
    updatedAt: new Date().toISOString()
  });
};

export const getDashboardData = async (): Promise<DashboardResponse> => {
  const indexes = normalizeIndexes(createEmptyIndexes());

  await updateSingleQuoteBySchedule();

  indexes.forEach((item) => {
    const cache = liveQuoteCache.get(item.id);

    if (!cache) {
      return;
    }

    item.latestPrice = cache.price;
    item.updatedAt = cache.updatedAt;
    item.returns.d1 = cache.changePercent;
  });

  return {
    source: 'api',
    indexes
  };
};
