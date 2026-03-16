'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { PeHistoryPoint } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface PeChartProps {
  history: PeHistoryPoint[];
  title: string;
}

export function PeChart({ history, title }: PeChartProps) {
  const data = {
    labels: history.map((point) => point.date),
    datasets: [
      {
        label: 'PE-TTM',
        data: history.map((point) => point.pe),
        borderColor: '#0891b2',
        backgroundColor: 'rgba(8,145,178,0.15)',
        pointRadius: 2,
        tension: 0.28
      },
      {
        label: '买入阈值（20%）',
        data: history.map(() => 20),
        borderColor: '#16a34a',
        borderDash: [6, 4],
        pointRadius: 0,
        borderWidth: 1
      },
      {
        label: '卖出阈值（80%）',
        data: history.map(() => 80),
        borderColor: '#dc2626',
        borderDash: [6, 4],
        pointRadius: 0,
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">{title} - 历史估值趋势</h3>
      <div className="h-[280px]">
        <Line
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: {
                labels: { boxWidth: 10, usePointStyle: true }
              }
            },
            scales: {
              y: {
                grid: { color: '#e2e8f0' }
              },
              x: {
                grid: { display: false }
              }
            }
          }}
        />
      </div>
    </div>
  );
}
