import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("首页", systemImage: "house") }

            HistoryView()
                .tabItem { Label("记录", systemImage: "list.bullet.rectangle") }

            FamilyListView()
                .tabItem { Label("家人", systemImage: "person.3") }

            ProfileView()
                .tabItem { Label("我的", systemImage: "person.crop.circle") }
        }
    }
}
