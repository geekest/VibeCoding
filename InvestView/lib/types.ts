export type Zone = 'buy' | 'hold' | 'sell';

export interface ReturnMetrics {
  d1: number;
  w1: number;
  m1: number;
  m3: number;
  m6: number;
  y1: number;
  y2: number;
  y5: number;
}

export interface PeChangeMetrics {
  m3: number;
  m6: number;
  y1: number;
}

export interface PePercentiles {
  y3: number;
  y5: number;
  y10: number;
}

export interface PeHistoryPoint {
  date: string;
  pe: number;
  percentile: number;
}

export interface IndexData {
  id: string;
  name: string;
  market: string;
  symbol: string;
  latestPrice: number;
  currency: string;
  peTtm: number;
  peFwd: number;
  pbTtm: number;
  peg: number;
  peChanges: PeChangeMetrics;
  pePercentiles: PePercentiles;
  returns: ReturnMetrics;
  zone: Zone;
  updatedAt: string;
  history: PeHistoryPoint[];
}

export interface DashboardResponse {
  source: 'api' | 'mock';
  indexes: IndexData[];
}
