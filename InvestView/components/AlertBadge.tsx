import { TriangleAlert, ShieldCheck, TrendingUp } from 'lucide-react';
import { Zone } from '@/lib/types';

interface AlertBadgeProps {
  zone: Zone;
}

const config = {
  buy: {
    label: '买入/击球区',
    className: 'bg-green-100 text-green-700',
    icon: TrendingUp
  },
  hold: {
    label: '持有/观察区',
    className: 'bg-amber-100 text-amber-700',
    icon: ShieldCheck
  },
  sell: {
    label: '卖出/警戒区',
    className: 'bg-red-100 text-red-700',
    icon: TriangleAlert
  }
} as const;

export function AlertBadge({ zone }: AlertBadgeProps) {
  const CurrentIcon = config[zone].icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${config[zone].className}`}>
      <CurrentIcon size={14} />
      {config[zone].label}
    </span>
  );
}
