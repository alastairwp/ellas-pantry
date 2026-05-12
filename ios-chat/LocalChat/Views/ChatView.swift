import SwiftUI

struct ChatView: View {
    @Bindable var vm: ChatViewModel
    @FocusState private var inputFocused: Bool

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(vm.messages) { msg in
                            MessageBubble(role: msg.role, content: msg.content)
                                .id(msg.id)
                        }
                        if vm.isGenerating {
                            MessageBubble(
                                role: .assistant,
                                content: vm.streamingDraft.isEmpty ? "…" : vm.streamingDraft
                            )
                            .id("streaming")
                        }
                        if let err = vm.errorMessage {
                            Text(err)
                                .font(.footnote)
                                .foregroundStyle(.red)
                                .padding(.horizontal)
                        }
                    }
                    .padding(.vertical, 12)
                }
                .onChange(of: vm.messages.count) { _, _ in
                    withAnimation { proxy.scrollTo("streaming", anchor: .bottom) }
                }
                .onChange(of: vm.streamingDraft) { _, _ in
                    proxy.scrollTo("streaming", anchor: .bottom)
                }
            }

            Divider()

            HStack(alignment: .bottom, spacing: 8) {
                TextField("Message", text: $vm.input, axis: .vertical)
                    .lineLimit(1...5)
                    .textFieldStyle(.roundedBorder)
                    .focused($inputFocused)
                    .onSubmit { vm.send() }

                if vm.isGenerating {
                    Button { vm.stop() } label: {
                        Image(systemName: "stop.circle.fill").font(.title2)
                    }
                } else {
                    Button { vm.send() } label: {
                        Image(systemName: "arrow.up.circle.fill").font(.title2)
                    }
                    .disabled(vm.input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            .padding(8)
        }
        .navigationTitle(vm.conversation.title)
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct MessageBubble: View {
    let role: ChatRole
    let content: String

    var body: some View {
        HStack {
            if role == .user { Spacer(minLength: 40) }
            Text(content)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(bubbleColor, in: RoundedRectangle(cornerRadius: 16))
                .foregroundStyle(role == .user ? .white : .primary)
                .textSelection(.enabled)
            if role != .user { Spacer(minLength: 40) }
        }
        .padding(.horizontal, 12)
    }

    private var bubbleColor: Color {
        switch role {
        case .user: return .accentColor
        case .assistant: return Color(.systemGray6)
        case .system: return Color(.systemGray5)
        }
    }
}
