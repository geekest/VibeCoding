import Foundation

actor MockAPIService {
    func sync(status: DailyStatus) async {
        try? await Task.sleep(nanoseconds: 300_000_000)
    }
}
