import SwiftUI

@main
struct FamilyConnectApp: App {
    @StateObject private var store = AppStore()

    var body: some Scene {
        WindowGroup {
            MainTabView()
                .environmentObject(store)
                .task {
                    store.bootstrapTodayStatusIfNeeded()
                    await store.mockSyncTodayStatus()
                    store.scheduleRemindersIfNeeded()
                }
        }
    }
}
