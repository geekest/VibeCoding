import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var store: AppStore

    var body: some View {
        NavigationStack {
            List {
                Section("个人信息") {
                    Text("姓名：\(store.user.name)")
                }

                Section("字体") {
                    Picker("字体大小", selection: Binding(get: {
                        store.profile.fontSize
                    }, set: { newValue in
                        store.updateProfile { $0.fontSize = newValue }
                    })) {
                        ForEach(FontSizeOption.allCases) { item in
                            Text(item.rawValue).tag(item)
                        }
                    }
                }

                Section("提醒时间") {
                    DatePicker("提醒", selection: reminderBinding, displayedComponents: .hourAndMinute)
                }

                Section("通知") {
                    Toggle("开启通知", isOn: Binding(get: {
                        store.profile.notificationsEnabled
                    }, set: { value in
                        store.updateProfile { $0.notificationsEnabled = value }
                        store.scheduleRemindersIfNeeded()
                    }))
                }

                Section("帮助") {
                    Text("联系客服")
                    Text("关于应用")
                }
            }
            .navigationTitle("我的")
        }
    }

    private var reminderBinding: Binding<Date> {
        Binding {
            var c = DateComponents()
            c.hour = store.profile.reminderHour
            c.minute = store.profile.reminderMinute
            return Calendar.current.date(from: c) ?? Date()
        } set: { newDate in
            let c = Calendar.current.dateComponents([.hour, .minute], from: newDate)
            store.updateProfile {
                $0.reminderHour = c.hour ?? 9
                $0.reminderMinute = c.minute ?? 0
            }
            store.scheduleRemindersIfNeeded()
        }
    }
}
