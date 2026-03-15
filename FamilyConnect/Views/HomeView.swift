import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var store: AppStore
    @State private var showSyncedTip = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    greetingCard
                    moodCard
                    activityCards
                    familyFeedback
                    quickActions
                }
                .padding(16)
            }
            .background(Color(hex: "F5F5F5").ignoresSafeArea())
            .navigationTitle("首页")
        }
    }

    private var greetingCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("早上好，\(store.user.name)").font(.system(size: 22, weight: .bold))
            Text("今天是：\(todayPrettyString())\n\(weekdayString())")
                .font(.system(size: 14))
                .foregroundStyle(.secondary)
            Text("今日状态：\(store.todayStatus.mood?.title ?? "尚未更新")")
                .font(.system(size: 17))
        }
        .frame(maxWidth: .infinity, minHeight: 100, alignment: .leading)
        .padding()
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var moodCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("今天感觉怎么样？").font(.system(size: 17, weight: .semibold))
            moodButton("良好", color: "4CAF50", mood: .good)
            moodButton("一般", color: "FFC107", mood: .normal)
            moodButton("不佳", color: "F44336", mood: .bad)
            if showSyncedTip { Text("已通知家人。") .font(.system(size: 14)).foregroundStyle(.secondary) }
        }
        .padding()
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var activityCards: some View {
        VStack(spacing: 16) {
            activityCard(icon: "💊", title: "吃药", question: "今天已吃药吗？", buttonText: "我已经吃了", done: store.todayStatus.medicine) {
                store.markMedicine()
            }
            activityCard(icon: "🚶", title: "散步", question: "今天活动了吗？", buttonText: "今天走了", done: store.todayStatus.exercise) {
                store.markExercise()
            }
            activityCard(icon: "📖", title: "阅读", question: "今天看书了吗？", buttonText: "今天读了", done: store.todayStatus.reading) {
                store.markReading()
            }
        }
    }

    private var familyFeedback: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("家人查看状态：")
            if let daughter = store.user.familyMembers.first {
                Text("\(daughter.name)已看到你的更新 ❤️")
                let son = store.user.familyMembers.dropFirst().first
                let sonName = son?.name ?? "儿子"
                let sonMessage = (son?.message.isEmpty == false) ? (son?.message ?? "") : "暂无"
                Text("\(sonName)留言：\(sonMessage)")
            } else {
                Text("暂无家人动态。")
            }
        }
        .font(.system(size: 14))
        .frame(maxWidth: .infinity, minHeight: 80, alignment: .leading)
        .padding()
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var quickActions: some View {
        VStack(spacing: 12) {
            NavigationLink("联系家人") { FamilyListView() }
                .quickActionStyle()
            NavigationLink("补充情况") { StatusView() }
                .quickActionStyle()
        }
    }

    private func moodButton(_ text: String, color: String, mood: Mood) -> some View {
        Button {
            showSyncedTip = true
            store.updateMood(mood)
        } label: {
            Text(text)
                .frame(maxWidth: .infinity, minHeight: 60)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(.white)
                .background(Color(hex: color))
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    private func activityCard(icon: String, title: String, question: String, buttonText: String, done: Bool, action: @escaping () -> Void) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("\(icon) \(title)").font(.system(size: 17, weight: .semibold))
            Text(question).font(.system(size: 14)).foregroundStyle(.secondary)
            Button(buttonText, action: action)
                .frame(minHeight: 56)
            Text(done ? "已记录 \(timeString(store.todayStatus.updatedTime))" : "未记录")
                .font(.system(size: 14))
                .foregroundStyle(done ? .green : .secondary)
        }
        .frame(maxWidth: .infinity, minHeight: 90, alignment: .leading)
        .padding(16)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func todayPrettyString() -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "zh_CN")
        f.dateFormat = "yyyy年M月d日"
        return f.string(from: Date())
    }

    private func weekdayString() -> String {
        let w = Calendar.current.component(.weekday, from: Date())
        let map = ["", "星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"]
        return map[w]
    }

    private func timeString(_ timestamp: TimeInterval) -> String {
        guard timestamp > 0 else { return "--:--" }
        let date = Date(timeIntervalSince1970: timestamp)
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f.string(from: date)
    }
}

private extension View {
    func quickActionStyle() -> some View {
        self
            .frame(maxWidth: .infinity, minHeight: 56)
            .background(Color(hex: "E3F2FD"))
            .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255.0
        let g = Double((int >> 8) & 0xFF) / 255.0
        let b = Double(int & 0xFF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}
