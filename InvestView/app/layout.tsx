import type { Metadata } from 'next';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'InvestView - 个人投资看板',
  description: '监控全球指数估值、收益区间与PE历史分位，辅助低买高卖策略执行。'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
