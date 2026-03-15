import SwiftUI

struct FamilyListView: View {
    @EnvironmentObject private var store: AppStore

    var body: some View {
        NavigationStack {
            List(store.user.familyMembers) { member in
                NavigationLink {
                    FamilyDetailView(memberID: member.id)
                } label: {
                    HStack(spacing: 12) {
                        Circle().fill(Color.blue.opacity(0.2)).frame(width: 40, height: 40)
                        VStack(alignment: .leading) {
                            Text(member.name)
                            Text(member.lastViewed > 0 ? "今天已查看" : "未查看")
                                .font(.system(size: 14))
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .navigationTitle("家人列表")
        }
    }
}
