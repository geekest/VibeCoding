# InvestView

基于 Next.js + TypeScript + Tailwind CSS 构建的个人投资估值看板，用于监控核心指数 PE-TTM 与历史分位。

## 本地启动

```bash
npm install
npm run dev
```

## 真实 API 接入位置

- 服务层文件：`services/market-data.ts`
- 在 `TODO` 注释处替换 `MockMarketDataProvider` 为真实 provider。
- 建议在 `.env.local` 中配置：

```env
FINNHUB_API_KEY=your_key_here
ALPHA_VANTAGE_API_KEY=your_key_here
```

## 当前功能

- 指数概览卡片（价格、涨跌、PE-TTM、10年分位）
- 20% / 80% 分位阈值颜色预警
- 各指数历史 PE-TTM 趋势图（含 20% 买入线、80% 卖出线）
- 响应式暗色金融终端风格 UI
