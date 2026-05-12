import SwiftUI
import SwiftData

struct ConversationListView: View {
    let modelURL: URL

    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Conversation.updatedAt, order: .reverse)
    private var conversations: [Conversation]

    @State private var engine: LlamaEngine?
    @State private var engineError: String?

    var body: some View {
        NavigationStack {
            Group {
                if let engine {
                    list(engine: engine)
                } else if let engineError {
                    VStack(spacing: 12) {
                        Text("Engine failed to load").font(.headline)
                        Text(engineError).font(.callout).foregroundStyle(.secondary)
                    }.padding()
                } else {
                    ProgressView("Loading model…")
                }
            }
            .navigationTitle("Chats")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        let new = Conversation()
                        modelContext.insert(new)
                        try? modelContext.save()
                    } label: {
                        Image(systemName: "square.and.pencil")
                    }
                    .disabled(engine == nil)
                }
            }
        }
        .task {
            do {
                let e = LlamaEngine(modelURL: modelURL, template: ModelCatalog.default.chatTemplate)
                try await e.load()
                self.engine = e
            } catch {
                self.engineError = error.localizedDescription
            }
        }
    }

    @ViewBuilder
    private func list(engine: LlamaEngine) -> some View {
        if conversations.isEmpty {
            ContentUnavailableView(
                "No chats yet",
                systemImage: "bubble.left.and.bubble.right",
                description: Text("Tap the pencil to start one.")
            )
        } else {
            List {
                ForEach(conversations) { convo in
                    NavigationLink {
                        ChatView(vm: ChatViewModel(
                            conversation: convo,
                            engine: engine,
                            modelContext: modelContext
                        ))
                    } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(convo.title).lineLimit(1)
                            Text(convo.updatedAt, style: .relative)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .onDelete { indexSet in
                    for i in indexSet { modelContext.delete(conversations[i]) }
                    try? modelContext.save()
                }
            }
        }
    }
}
