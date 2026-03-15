import Foundation

enum Role: String, Codable {
    case parent
}

struct User: Codable {
    let id: String
    var name: String
    let role: Role
    var familyMembers: [FamilyMember]
}

enum Mood: String, Codable, CaseIterable {
    case good
    case normal
    case bad

    var title: String {
        switch self {
        case .good: return "良好"
        case .normal: return "一般"
        case .bad: return "不佳"
        }
    }
}

struct DailyStatus: Codable, Identifiable {
    var id: String { date }
    var date: String
    var mood: Mood?
    var medicine: Bool
    var exercise: Bool
    var reading: Bool
    var note: String
    var updatedTime: TimeInterval

    var isUpdated: Bool { mood != nil }
}

struct FamilyMember: Codable, Identifiable {
    let id: String
    var name: String
    var relation: String
    var lastViewed: TimeInterval
    var message: String
}

enum FontSizeOption: String, Codable, CaseIterable, Identifiable {
    case standard = "标准"
    case large = "大"
    case xLarge = "超大"
    var id: String { rawValue }
}

struct ProfileSettings: Codable {
    var fontSize: FontSizeOption
    var reminderHour: Int
    var reminderMinute: Int
    var notificationsEnabled: Bool
}
