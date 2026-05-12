import Foundation
import Observation
import SwiftData

@Observable
@MainActor
final class ChatViewModel {
    var conversation: Conversation
    var input: String = ""
    var isGenerating: Bool = false
    var streamingDraft: String = ""
    var errorMessage: String?

    /// System prompt — adjust the assistant's persona/behavior here.
    var systemPrompt: String = """
    You are a helpful, concise assistant running entirely on the user's iPhone. \
    You respect the user's autonomy as an adult and answer directly without lecturing.
    """

    private let engine: LlamaEngine
    private let modelContext: ModelContext
    private var currentTask: Task<Void, Never>?

    init(conversation: Conversation, engine: LlamaEngine, modelContext: ModelContext) {
        self.conversation = conversation
        self.engine = engine
        self.modelContext = modelContext
    }

    var messages: [StoredMessage] {
        conversation.orderedMessages
    }

    func send() {
        let trimmed = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !isGenerating else { return }
        input = ""
        errorMessage = nil

        let userMsg = StoredMessage(role: .user, content: trimmed)
        userMsg.conversation = conversation
        conversation.messages.append(userMsg)
        conversation.updatedAt = .now
        if conversation.messages.count == 1 {
            conversation.title = String(trimmed.prefix(40))
        }
        try? modelContext.save()

        let prompt = buildPromptMessages()
        isGenerating = true
        streamingDraft = ""

        currentTask = Task {
            defer { isGenerating = false }
            do {
                let stream = await engine.generate(messages: prompt)
                for try await piece in stream {
                    streamingDraft += piece
                }
                let assistant = StoredMessage(role: .assistant, content: streamingDraft)
                assistant.conversation = conversation
                conversation.messages.append(assistant)
                conversation.updatedAt = .now
                streamingDraft = ""
                try? modelContext.save()
            } catch is CancellationError {
                if !streamingDraft.isEmpty {
                    let partial = StoredMessage(role: .assistant, content: streamingDraft + "\n\n[stopped]")
                    partial.conversation = conversation
                    conversation.messages.append(partial)
                    try? modelContext.save()
                }
                streamingDraft = ""
            } catch {
                errorMessage = error.localizedDescription
                streamingDraft = ""
            }
        }
    }

    func stop() {
        currentTask?.cancel()
    }

    private func buildPromptMessages() -> [ChatMessage] {
        var out: [ChatMessage] = [ChatMessage(role: .system, content: systemPrompt)]
        for m in conversation.orderedMessages {
            out.append(ChatMessage(role: m.role, content: m.content))
        }
        return out
    }
}
