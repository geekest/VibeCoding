export type MarketRegion = "US" | "CN" | "HK" | "DEFENSIVE";

export interface PeHistoryPoint {
  date: string;
  peTtm: number;
}

export interface IndexAsset {
  id: string;
  name: string;
  symbol: string;
  region: MarketRegion;
  price: number;
  dailyChangePct: number;
  peTtm: number;
  pePercentile: number;
  history: PeHistoryPoint[];
  updatedAt: string;
}

export interface MarketDataProvider {
  fetchOverview(): Promise<IndexAsset[]>;
}
