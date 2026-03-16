import { IndexData } from '@/lib/types';

const createHistory = (basePe: number): IndexData['history'] =>
  Array.from({ length: 18 }).map((_, idx) => {
    const pe = Number((basePe + Math.sin(idx / 2) * 3 + idx * 0.08).toFixed(2));
    const percentile = Math.max(5, Math.min(95, Number((pe / 35 * 100).toFixed(1))));

    return {
      date: `202${Math.floor(idx / 12) + 4}-${String((idx % 12) + 1).padStart(2, '0')}`,
      pe,
      percentile
    };
  });

export const mockIndexes: IndexData[] = [
  {
    id: 'sp500',
    name: '标普500',
    market: '美股与全球',
    symbol: 'SPX',
    latestPrice: 5298.41,
    currency: 'USD',
    peTtm: 24.8,
    pePercentiles: { y3: 63, y5: 68, y10: 72 },
    returns: { d1: 0.62, w1: 1.34, m1: 3.01, m3: 6.98, m6: 10.22, y1: 18.73, y2: 22.8, y5: 78.16 },
    zone: 'hold',
    updatedAt: new Date().toISOString(),
    history: createHistory(22)
  },
  {
    id: 'nasdaq100',
    name: '纳斯达克100',
    market: '美股与全球',
    symbol: 'NDX',
    latestPrice: 18812.12,
    currency: 'USD',
    peTtm: 31.5,
    pePercentiles: { y3: 70, y5: 74, y10: 79 },
    returns: { d1: 0.45, w1: 1.1, m1: 4.22, m3: 8.6, m6: 13.4, y1: 25.3, y2: 33.6, y5: 132.1 },
    zone: 'sell',
    updatedAt: new Date().toISOString(),
    history: createHistory(28)
  },
  {
    id: 'ftse100',
    name: '富时100',
    market: '美股与全球',
    symbol: 'FTSE',
    latestPrice: 8344.22,
    currency: 'GBP',
    peTtm: 14.1,
    pePercentiles: { y3: 38, y5: 43, y10: 40 },
    returns: { d1: 0.18, w1: 0.56, m1: 1.42, m3: 2.24, m6: 4.31, y1: 7.92, y2: 9.5, y5: 18.7 },
    zone: 'hold',
    updatedAt: new Date().toISOString(),
    history: createHistory(15)
  },
  {
    id: 'hs300',
    name: '沪深300',
    market: 'A股宽基',
    symbol: '000300.SH',
    latestPrice: 3588.9,
    currency: 'CNY',
    peTtm: 11.8,
    pePercentiles: { y3: 22, y5: 26, y10: 29 },
    returns: { d1: -0.3, w1: -1.24, m1: -3.11, m3: -4.2, m6: -2.8, y1: -8.65, y2: -14.23, y5: -12.9 },
    zone: 'buy',
    updatedAt: new Date().toISOString(),
    history: createHistory(13)
  },
  {
    id: 'csi500',
    name: '中证500',
    market: 'A股宽基',
    symbol: '000905.SH',
    latestPrice: 5272.2,
    currency: 'CNY',
    peTtm: 22.3,
    pePercentiles: { y3: 35, y5: 33, y10: 31 },
    returns: { d1: -0.12, w1: -0.9, m1: -2.23, m3: -5.42, m6: -4.96, y1: -10.3, y2: -20.2, y5: 2.6 },
    zone: 'hold',
    updatedAt: new Date().toISOString(),
    history: createHistory(20)
  },
  {
    id: 'gem',
    name: '创业板指',
    market: 'A股宽基',
    symbol: '399006.SZ',
    latestPrice: 1883.5,
    currency: 'CNY',
    peTtm: 39.8,
    pePercentiles: { y3: 74, y5: 79, y10: 84 },
    returns: { d1: 0.2, w1: 0.4, m1: 1.6, m3: -2.1, m6: 3.8, y1: -6.2, y2: -18.4, y5: 10.3 },
    zone: 'sell',
    updatedAt: new Date().toISOString(),
    history: createHistory(33)
  },
  {
    id: 'hstech',
    name: '恒生科技指数',
    market: '港股市场',
    symbol: 'HSTECH',
    latestPrice: 3692.14,
    currency: 'HKD',
    peTtm: 18.5,
    pePercentiles: { y3: 19, y5: 24, y10: 27 },
    returns: { d1: -0.22, w1: 0.9, m1: 2.1, m3: -1.5, m6: 5.8, y1: -4.1, y2: -36.2, y5: -51.3 },
    zone: 'buy',
    updatedAt: new Date().toISOString(),
    history: createHistory(17)
  },
  {
    id: 'hsi',
    name: '恒生指数',
    market: '港股市场',
    symbol: 'HSI',
    latestPrice: 18212.9,
    currency: 'HKD',
    peTtm: 9.5,
    pePercentiles: { y3: 27, y5: 30, y10: 34 },
    returns: { d1: -0.1, w1: 0.4, m1: 1.1, m3: -0.9, m6: 3.2, y1: -2.5, y2: -12.3, y5: -18.8 },
    zone: 'buy',
    updatedAt: new Date().toISOString(),
    history: createHistory(10)
  },
  {
    id: 'hsi-lowvol',
    name: '恒生红利低波指数',
    market: '港股市场',
    symbol: 'HSLVD',
    latestPrice: 5123.6,
    currency: 'HKD',
    peTtm: 7.2,
    pePercentiles: { y3: 31, y5: 36, y10: 39 },
    returns: { d1: 0.05, w1: 0.31, m1: 0.96, m3: 1.84, m6: 4.11, y1: 8.7, y2: 11.5, y5: 20.4 },
    zone: 'hold',
    updatedAt: new Date().toISOString(),
    history: createHistory(8)
  },
  {
    id: 'csi-lowvol-dividend',
    name: '中证红利低波指数',
    market: '防御性资产',
    symbol: '930955.CSI',
    latestPrice: 6892.7,
    currency: 'CNY',
    peTtm: 10.4,
    pePercentiles: { y3: 44, y5: 48, y10: 52 },
    returns: { d1: 0.08, w1: 0.71, m1: 1.9, m3: 3.9, m6: 6.3, y1: 12.2, y2: 21.1, y5: 54.2 },
    zone: 'hold',
    updatedAt: new Date().toISOString(),
    history: createHistory(11)
  },
  {
    id: 'hushen-hk-dividend-growth-lowvol',
    name: '沪港深红利成长低波指数',
    market: '防御性资产',
    symbol: '931021.CSI',
    latestPrice: 4211.1,
    currency: 'CNY',
    peTtm: 11.6,
    pePercentiles: { y3: 40, y5: 43, y10: 46 },
    returns: { d1: 0.12, w1: 0.8, m1: 2.7, m3: 5.2, m6: 8.7, y1: 15.4, y2: 18.9, y5: 61.1 },
    zone: 'hold',
    updatedAt: new Date().toISOString(),
    history: createHistory(12)
  },
  {
    id: 'gold-etf',
    name: '黄金ETF',
    market: '贵金属',
    symbol: '518880.SH',
    latestPrice: 4.92,
    currency: 'CNY',
    peTtm: 0,
    pePercentiles: { y3: 55, y5: 60, y10: 64 },
    returns: { d1: 0.43, w1: 1.55, m1: 4.9, m3: 7.8, m6: 12.5, y1: 20.6, y2: 28.8, y5: 49.6 },
    zone: 'hold',
    updatedAt: new Date().toISOString(),
    history: createHistory(16)
  }
];
