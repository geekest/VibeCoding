import { AlertBadge } from '@/components/AlertBadge';
import { IndexData } from '@/lib/types';

interface IndexCardProps {
  data: IndexData;
}

const zoneClassName: Record<IndexData['zone'], string> = {
  buy: 'border-l-4 border-l-green-500',
  hold: 'border-l-4 border-l-amber-500',
  sell: 'border-l-4 border-l-red-500'
};

const currencySymbolMap: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  HKD: 'HK$',
  GBP: '£',
  EUR: '€'
};

const getCurrencySymbol = (currency: string): string => currencySymbolMap[currency] ?? currency;

const formatSignedPercent = (value: number): string => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

const formatMetric = (value: number): string => (value === 0 ? 'N/A' : value.toFixed(2));

const ReturnPill = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg bg-slate-50 px-2 py-1 text-xs">
    <p className="text-slate-500">{label}</p>
    <p className={value >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{formatSignedPercent(value)}</p>
  </div>
);

const MetricTile = ({ label, title, value, className }: { label: string; title: string; value: string; className: string }) => (
  <div className={`rounded-lg p-2 text-center ${className}`}>
    <p className="text-slate-500">
      <span className="cursor-help underline decoration-dotted" title={title}>
        {label}
      </span>
    </p>
    <p className="text-lg font-bold text-slate-900">{value}</p>
  </div>
);

export function IndexCard({ data }: IndexCardProps) {
  const currencySymbol = getCurrencySymbol(data.currency);

  return (
    <article className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 ${zoneClassName[data.zone]}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-slate-500">{data.market}</p>
          <h3 className="text-lg font-semibold text-slate-900">{data.name}</h3>
          <p className="text-xs text-slate-500">{data.symbol}</p>
        </div>
        <AlertBadge zone={data.zone} />
      </div>

      <div className="mb-3 rounded-xl bg-slate-50 p-3">
        <p className="text-xs text-slate-500">实时估值价格</p>
        <p className="text-lg font-medium text-slate-600">
          {currencySymbol}
          {data.latestPrice.toLocaleString('zh-CN')}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-lg bg-cyan-50 p-2 text-center">
          <p className="text-slate-500">
            <span
              className="cursor-help underline decoration-dotted"
              title="PE含TTM与FWD；TTM=过去12月市盈率，FWD=未来12月预期市盈率"
            >
              PE
            </span>
          </p>
          <p className="text-lg font-bold text-cyan-900">
            {formatMetric(data.peTtm)}/{formatMetric(data.peFwd)}
          </p>
        </div>

        <MetricTile label="PB" title="每股净资产倍数" value={data.pbTtm.toFixed(2)} className="bg-indigo-50" />
        <MetricTile label="PEG" title="市盈率相对增速" value={data.peg.toFixed(2)} className="bg-violet-50" />
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2">
        <ReturnPill label="1天" value={data.returns.d1} />
        <ReturnPill label="1周" value={data.returns.w1} />
        <ReturnPill label="1月" value={data.returns.m1} />
        <ReturnPill label="3月" value={data.returns.m3} />
        <ReturnPill label="6月" value={data.returns.m6} />
        <ReturnPill label="1年" value={data.returns.y1} />
        <ReturnPill label="2年" value={data.returns.y2} />
        <ReturnPill label="5年" value={data.returns.y5} />
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-slate-100 p-2 text-center">
          <p className="text-slate-500">3年PE分位</p>
          <p className="text-lg font-bold text-slate-900">{data.pePercentiles.y3}%</p>
        </div>
        <div className="rounded-lg bg-slate-100 p-2 text-center">
          <p className="text-slate-500">5年PE分位</p>
          <p className="text-lg font-bold text-slate-900">{data.pePercentiles.y5}%</p>
        </div>
        <div className="rounded-lg bg-slate-100 p-2 text-center">
          <p className="text-slate-500">10年PE分位</p>
          <p className="text-xl font-extrabold text-cyan-900">{data.pePercentiles.y10}%</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-cyan-50 p-2 text-center">
          <p className="text-slate-500">PE近3月变化</p>
          <p className={data.peChanges.m3 >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>{formatSignedPercent(data.peChanges.m3)}</p>
        </div>
        <div className="rounded-lg bg-cyan-50 p-2 text-center">
          <p className="text-slate-500">PE近6月变化</p>
          <p className={data.peChanges.m6 >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>{formatSignedPercent(data.peChanges.m6)}</p>
        </div>
        <div className="rounded-lg bg-cyan-50 p-2 text-center">
          <p className="text-slate-500">PE近1年变化</p>
          <p className={data.peChanges.y1 >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>{formatSignedPercent(data.peChanges.y1)}</p>
        </div>
      </div>
    </article>
  );
}
