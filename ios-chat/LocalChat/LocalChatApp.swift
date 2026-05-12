import SwiftUI
import SwiftData

@main
struct LocalChatApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
        }
        .modelContainer(for: [Conversation.self, StoredMessage.self])
    }
}

struct RootView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var modelStore = ModelStore()

    var body: some View {
        Group {
            switch modelStore.state {
            case .needsDownload, .downloading:
                ModelDownloadView(store: modelStore)
            case .ready(let url):
                ConversationListView(modelURL: url)
            case .failed(let message):
                VStack(spacing: 16) {
                    Text("Couldn't prepare the model")
                        .font(.headline)
                    Text(message)
                        .font(.callout)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                    Button("Retry") { Task { await modelStore.prepare() } }
                        .buttonStyle(.borderedProminent)
                }
                .padding()
            }
        }
        .task { await modelStore.prepare() }
    }
}
