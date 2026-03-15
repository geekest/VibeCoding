import Foundation

@MainActor
final class AppStore: ObservableObject {
    @Published var user: User
    @Published var statuses: [DailyStatus]
    @Published var profile: ProfileSettings

    private let storage = LocalStorage.shared
    private let mockAPI = MockAPIService()

    init() {
        self.user = storage.load(User.self, from: "user.json") ?? User(
            id: "u-parent-001",
            name: "王叔叔",
            role: .parent,
            familyMembers: [
                FamilyMember(id: "fm-1", name: "女儿", relation: "daughter", lastViewed: Date().timeIntervalSince1970, message: "多休息。"),
                FamilyMember(id: "fm-2", name: "儿子", relation: "son", lastViewed: 0, message: "")
            ]
        )
        self.statuses = storage.load([DailyStatus].self, from: "statuses.json") ?? []
        self.profile = storage.load(ProfileSettings.self, from: "profile.json") ?? ProfileSettings(fontSize: .standard, reminderHour: 9, reminderMinute: 0, notificationsEnabled: true)
    }

    var todayString: String {
        Self.dateFormatter.string(from: Date())
    }

    var todayStatus: DailyStatus {
        statuses.first(where: { $0.date == todayString }) ?? DailyStatus(date: todayString, mood: nil, medicine: false, exercise: false, reading: false, note: "", updatedTime: 0)
    }

    var sortedStatuses: [DailyStatus] {
        statuses.sorted(by: { $0.date > $1.date })
    }

    func bootstrapTodayStatusIfNeeded() {
        guard !statuses.contains(where: { $0.date == todayString }) else { return }
        statuses.append(DailyStatus(date: todayString, mood: nil, medicine: false, exercise: false, reading: false, note: "", updatedTime: 0))
        persistAll()
    }

    func updateMood(_ mood: Mood) {
        updateToday { $0.mood = mood }
    }

    func markMedicine() { updateToday { $0.medicine = true } }
    func markExercise() { updateToday { $0.exercise = true } }
    func markReading() { updateToday { $0.reading = true } }

    func updateNote(_ text: String) {
        updateToday { $0.note = text }
    }

    func updateFamilyMessage(memberID: String, message: String) {
        guard let idx = user.familyMembers.firstIndex(where: { $0.id == memberID }) else { return }
        user.familyMembers[idx].message = message
        persistUser()
    }

    func updateProfile(_ block: (inout ProfileSettings) -> Void) {
        block(&profile)
        storage.save(profile, to: "profile.json")
    }

    func mockSyncTodayStatus() async {
        await mockAPI.sync(status: todayStatus)
    }

    func scheduleRemindersIfNeeded() {
        ReminderService.shared.scheduleDailyReminders(enabled: profile.notificationsEnabled, hour: profile.reminderHour, minute: profile.reminderMinute)
    }

    private func updateToday(_ mutation: (inout DailyStatus) -> Void) {
        guard let idx = statuses.firstIndex(where: { $0.date == todayString }) else { return }
        mutation(&statuses[idx])
        statuses[idx].updatedTime = Date().timeIntervalSince1970
        persistStatuses()
        Task { await mockSyncTodayStatus() }
    }

    private func persistAll() {
        persistUser()
        persistStatuses()
        storage.save(profile, to: "profile.json")
    }

    private func persistUser() {
        storage.save(user, to: "user.json")
    }

    private func persistStatuses() {
        storage.save(statuses, to: "statuses.json")
    }

    private static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()
}
