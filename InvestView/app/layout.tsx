import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InvestView - 估值轮动看板",
  description: "追踪核心指数 PE-TTM 与历史分位的个人投资看板",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
