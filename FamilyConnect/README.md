# FamilyConnect 父母端 MVP（iOS SwiftUI）

这是基于你提供 PRD 创建的 **可落地 MVP 模型**，采用：

- iOS 17+
- SwiftUI + MVVM
- 本地 JSON 存储
- Mock API 同步
- 本地提醒（09:00 + 20:00）

## 页面结构

Tab Bar：
- Home（HomeView）
- Records（HistoryView）
- Family（FamilyListView）
- Profile（ProfileView）

独立页面：
- StatusView（从 Home 快捷入口进入）
- FamilyDetailView（从 FamilyList 进入）

## 目录结构

- `FamilyConnectApp.swift`：应用入口
- `Models/Models.swift`：`User`、`DailyStatus`、`FamilyMember`、`ProfileSettings`
- `ViewModels/AppStore.swift`：核心状态管理（MVVM 的 VM 层）
- `Services/LocalStorage.swift`：JSON 本地存储
- `Services/MockAPIService.swift`：mock 同步接口
- `Services/ReminderService.swift`：提醒逻辑
- `Views/*.swift`：各页面与组件

## 关键规则映射

- 单击即完成记录：`updateMood/markMedicine/markExercise/markReading`
- 今日状态完成条件：`mood != nil`
- 每天自动创建状态：`bootstrapTodayStatusIfNeeded()`
- 提醒：默认 09:00，20:00 二次提醒（由通知开关控制）

## 说明

该目录为 MVP 原型代码模型，可直接作为 Xcode 工程源码基础。

## 原型图全览

- 线框与信息架构：`原型图全览.md`
- Figma 复刻用 HTML 画板：`Prototype/figma_原型总览.html`
