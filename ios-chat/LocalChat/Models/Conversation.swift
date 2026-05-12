import Foundation
import SwiftData

@Model
final class Conversation {
    var title: String
    var createdAt: Date
    var updatedAt: Date

    @Relationship(deleteRule: .cascade, inverse: \StoredMessage.conversation)
    var messages: [StoredMessage] = []

    init(title: String = "New chat", createdAt: Date = .now) {
        self.title = title
        self.createdAt = createdAt
        self.updatedAt = createdAt
    }

    var orderedMessages: [StoredMessage] {
        messages.sorted { $0.createdAt < $1.createdAt }
    }
}

@Model
final class StoredMessage {
    var roleRaw: String
    var content: String
    var createdAt: Date
    var conversation: Conversation?

    init(role: ChatRole, content: String, createdAt: Date = .now) {
        self.roleRaw = role.rawValue
        self.content = content
        self.createdAt = createdAt
    }

    var role: ChatRole {
        ChatRole(rawValue: roleRaw) ?? .user
    }
}

enum ChatRole: String, Codable, Sendable {
    case system
    case user
    case assistant
}

struct ChatMessage: Identifiable, Hashable, Sendable {
    let id = UUID()
    let role: ChatRole
    var content: String
}
