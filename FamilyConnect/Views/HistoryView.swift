import SwiftUI

struct HistoryView: View {
    @EnvironmentObject private var store: AppStore

    var body: some View {
        NavigationStack {
            List {
                Section("最近7天：记录\(recentCount())天 🌱") {
                    if store.sortedStatuses.isEmpty {
                        Text("未记录。")
                    } else {
                        ForEach(store.sortedStatuses) { item in
                            VStack(alignment: .leading, spacing: 6) {
                                Text(dateDisplay(item.date)).font(.system(size: 17, weight: .semibold))
                                Text("状态：\(item.mood?.title ?? "未更新")")
                                Text("行为：吃药 \(mark(item.medicine))  散步 \(mark(item.exercise))  阅读 \(mark(item.reading))")
                                    .font(.system(size: 14))
                                    .foregroundStyle(.secondary)
                            }
                            .padding(.vertical, 6)
                        }
                    }
                }
            }
            .navigationTitle("历史记录")
        }
    }

    private func mark(_ ok: Bool) -> String { ok ? "✔" : "✘" }

    private func recentCount() -> Int {
        let calendar = Calendar.current
        let now = Date()
        return store.sortedStatuses.filter { status in
            guard let date = Self.dayFormatter.date(from: status.date) else { return false }
            return calendar.dateComponents([.day], from: date, to: now).day ?? 99 <= 7 && status.isUpdated
        }.count
    }

    private func dateDisplay(_ string: String) -> String {
        guard let date = Self.dayFormatter.date(from: string) else { return string }
        let f = DateFormatter()
        f.dateFormat = "M月d日"
        return f.string(from: date)
    }

    private static let dayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()
}
