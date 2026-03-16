# InvestView

个人投资看板，基于 Next.js App Router + TypeScript + Tailwind CSS 构建。

## 本地运行

```bash
npm install
npm run dev
```

访问 `http://localhost:3000`。

## 环境变量

复制 `.env.example` 为 `.env.local`，填入真实接口参数。

## 功能概览

- 核心指数卡片：价格、PE-TTM、多周期涨跌、3/5/10年分位。
- 颜色预警：分位 `< 30%` 为买入区；`30%-75%` 为观察区；`>= 75%` 为警戒区。
- 历史图表：PE趋势 + 20%/80% 水平阈值线。
- 服务层：优先走真实 API，失败自动降级到 Mock 数据。


## 预览说明

- 直接打开本地文件：`InvestView/index.html`。
- 通过 Next.js 访问：运行项目后打开 `http://localhost:3000/index.html`（文件位于 `public/index.html`，可避免 Not Found）。
