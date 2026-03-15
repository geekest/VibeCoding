import Foundation
import UserNotifications

final class ReminderService {
    static let shared = ReminderService()

    private init() {}

    func scheduleDailyReminders(enabled: Bool, hour: Int, minute: Int) {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: ["morning_reminder", "night_reminder"])
        guard enabled else { return }

        center.requestAuthorization(options: [.alert, .sound]) { granted, _ in
            guard granted else { return }
            self.schedule(id: "morning_reminder", title: "今天还没有更新状态。", hour: hour, minute: minute)
            self.schedule(id: "night_reminder", title: "今天还没有记录，记得更新一次状态。", hour: 20, minute: 0)
        }
    }

    private func schedule(id: String, title: String, hour: Int, minute: Int) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.sound = .default

        var date = DateComponents()
        date.hour = hour
        date.minute = minute

        let trigger = UNCalendarNotificationTrigger(dateMatching: date, repeats: true)
        let request = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request)
    }
}
