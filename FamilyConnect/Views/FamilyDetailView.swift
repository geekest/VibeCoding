import SwiftUI

struct FamilyDetailView: View {
    @EnvironmentObject private var store: AppStore
    let memberID: String

    @State private var showSheet = false

    private let quickMessages = ["我今天挺好的", "今天散步了", "不用担心"]

    var member: FamilyMember? {
        store.user.familyMembers.first(where: { $0.id == memberID })
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("姓名：\(member?.name ?? "-")").font(.system(size: 22, weight: .bold))
            Text("状态：今天已看到更新")
            let latestMessage = (member?.message.isEmpty == false) ? (member?.message ?? "") : "暂无"
            Text("最近留言：\(latestMessage)")

            Button("打电话") {}
                .frame(maxWidth: .infinity, minHeight: 56)
                .background(Color.green.opacity(0.2))
                .clipShape(RoundedRectangle(cornerRadius: 16))

            Button("发一句话") { showSheet = true }
                .frame(maxWidth: .infinity, minHeight: 56)
                .background(Color(hex: "E3F2FD"))
                .clipShape(RoundedRectangle(cornerRadius: 16))

            Spacer()
        }
        .padding(16)
        .background(Color(hex: "F5F5F5").ignoresSafeArea())
        .navigationTitle("家人详情")
        .confirmationDialog("发一句话", isPresented: $showSheet) {
            ForEach(quickMessages, id: \.self) { msg in
                Button(msg) {
                    store.updateFamilyMessage(memberID: memberID, message: msg)
                }
            }
        }
    }
}
