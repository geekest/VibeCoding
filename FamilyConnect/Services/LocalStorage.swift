import Foundation

final class LocalStorage {
    static let shared = LocalStorage()

    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()
    private let folderURL: URL

    private init() {
        let base = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first ?? URL(fileURLWithPath: NSTemporaryDirectory())
        self.folderURL = base.appendingPathComponent("FamilyConnect", isDirectory: true)
        try? FileManager.default.createDirectory(at: folderURL, withIntermediateDirectories: true)
    }

    func save<T: Encodable>(_ value: T, to fileName: String) {
        let url = folderURL.appendingPathComponent(fileName)
        guard let data = try? encoder.encode(value) else { return }
        try? data.write(to: url)
    }

    func load<T: Decodable>(_ type: T.Type, from fileName: String) -> T? {
        let url = folderURL.appendingPathComponent(fileName)
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? decoder.decode(T.self, from: data)
    }
}
