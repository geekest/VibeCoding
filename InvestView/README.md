# InvestView

基于 Next.js + TypeScript + Tailwind CSS 构建的个人投资估值看板，用于监控核心指数 PE-TTM 与历史分位。

## 已完成改造

- 首页改为**网页端定时调用** `GET /api/index-valuation`，打开页面即可看到最新估值数据。
- 服务层增加 `RealMarketDataProvider`，默认尝试调用指数 API（丹卷估值接口），自动映射到看板结构。
- 当外部 API 不可达时自动降级为本地 `Mock` 数据，确保页面始终可用。
- 新增“立即刷新”按钮，支持手动获取最新估值。

## 本地启动

```bash
npm install
npm run dev
```

访问：<http://localhost:3000>

## 环境变量

可选配置（不配置则使用默认指数 API 地址）：

```env
INDEX_VALUATION_API_URL=https://danjuanfunds.com/djapi/index_eva/dj
```

## 技术方案说明

### 1) 数据获取链路

1. 浏览器加载首页。
2. Next.js 页面先进行一次服务端拉取（首屏更快）。
3. 客户端组件每 15 分钟自动请求 `/api/index-valuation`，并支持手动刷新。
4. API Route 调用 `marketDataService.fetchOverview()`：
   - 优先走 `RealMarketDataProvider` 请求指数 API；
   - 失败自动降级 `MockMarketDataProvider`。

### 2) 为什么这样设计

- **可直接网页查看**：无需本地脚本，打开浏览器即看数据。
- **兼顾实时性与稳定性**：外部 API 波动时页面不空白。
- **便于切换数据源**：后续只需替换 provider 或 `INDEX_VALUATION_API_URL`。

### 3) 下一步可扩展建议

- 接入支持价格/涨跌幅的行情 API，与估值 API 合并，补全卡片中的价格数据。
- 引入 Redis 或数据库缓存，降低第三方 API 压力并记录历史曲线。
- 将指数清单改为配置文件，支持你自定义指数池。
