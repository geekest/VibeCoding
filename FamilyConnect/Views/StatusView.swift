import SwiftUI

struct StatusView: View {
    @EnvironmentObject private var store: AppStore
    @Environment(\.dismiss) private var dismiss

    @State private var selectedTags: Set<String> = []

    private let tags = ["有点头晕", "没睡好", "胃不舒服", "有点累"]

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("当前状态：\(store.todayStatus.mood?.title ?? "未设置")")
                .font(.system(size: 22, weight: .bold))

            Text("补充备注")
                .font(.system(size: 17, weight: .semibold))

            FlowTagView(tags: tags, selectedTags: $selectedTags)

            Button("完成") {
                store.updateNote(selectedTags.joined(separator: "，"))
                dismiss()
            }
            .frame(maxWidth: .infinity, minHeight: 56)
            .background(Color.blue)
            .foregroundStyle(.white)
            .clipShape(RoundedRectangle(cornerRadius: 16))

            Spacer()
        }
        .padding(16)
        .background(Color(hex: "F5F5F5").ignoresSafeArea())
        .navigationTitle("状态补充")
    }
}

struct FlowTagView: View {
    let tags: [String]
    @Binding var selectedTags: Set<String>

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(tags, id: \.self) { tag in
                Button {
                    if selectedTags.contains(tag) { selectedTags.remove(tag) }
                    else { selectedTags.insert(tag) }
                } label: {
                    Text(tag)
                        .font(.system(size: 14))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(selectedTags.contains(tag) ? Color.blue.opacity(0.2) : .white)
                        .clipShape(Capsule())
                }
                .buttonStyle(.plain)
            }
        }
    }
}
