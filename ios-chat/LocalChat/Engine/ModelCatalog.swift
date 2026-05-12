import Foundation

/// A model the app can run locally. Swap or add entries to try other models.
///
/// Sizes assume Q4_K_M quantization. For iPhone 14 (6 GB RAM) stay under ~2.2 GB
/// on-disk; iOS will jetsam the app if mapped + scratch memory exceeds ~3 GB.
struct ModelDescriptor: Identifiable, Hashable, Sendable {
    let id: String
    let displayName: String
    let downloadURL: URL
    let approximateBytes: Int64
    let chatTemplate: ChatTemplate
}

enum ChatTemplate: String, Sendable {
    /// ChatML — used by Dolphin, Hermes, Qwen and most uncensored fine-tunes.
    case chatML
    /// Llama 3 instruct format — used by Llama 3.x base instruct models.
    case llama3
    /// Mistral instruct format — `[INST] ... [/INST]`.
    case mistral
}

enum ModelCatalog {
    /// Default: Dolphin 3.0 on Llama 3.2 3B. ~2.0 GB. ChatML format.
    /// Less restrictive than stock Llama; runs on iPhone 14 with `nCtx = 2048`.
    static let `default` = ModelDescriptor(
        id: "dolphin-3.0-llama3.2-3b-q4_k_m",
        displayName: "Dolphin 3.0 Llama 3.2 3B (Q4_K_M)",
        downloadURL: URL(string: "https://huggingface.co/bartowski/Dolphin3.0-Llama3.2-3B-GGUF/resolve/main/Dolphin3.0-Llama3.2-3B-Q4_K_M.gguf")!,
        approximateBytes: 2_020_000_000,
        chatTemplate: .chatML
    )

    /// All known models the picker can offer.
    static let all: [ModelDescriptor] = [
        .default,
        ModelDescriptor(
            id: "hermes-3-llama3.2-3b-q4_k_m",
            displayName: "Hermes 3 Llama 3.2 3B (Q4_K_M)",
            downloadURL: URL(string: "https://huggingface.co/bartowski/Hermes-3-Llama-3.2-3B-GGUF/resolve/main/Hermes-3-Llama-3.2-3B-Q4_K_M.gguf")!,
            approximateBytes: 2_020_000_000,
            chatTemplate: .chatML
        ),
        ModelDescriptor(
            id: "ministral-3b-instruct-q4_k_m",
            displayName: "Ministral 3B Instruct (Q4_K_M)",
            downloadURL: URL(string: "https://huggingface.co/bartowski/Ministral-3B-Instruct-GGUF/resolve/main/Ministral-3B-Instruct-Q4_K_M.gguf")!,
            approximateBytes: 2_050_000_000,
            chatTemplate: .mistral
        ),
        ModelDescriptor(
            id: "llama-3.2-3b-instruct-q4_k_m",
            displayName: "Llama 3.2 3B Instruct (Q4_K_M)",
            downloadURL: URL(string: "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf")!,
            approximateBytes: 2_020_000_000,
            chatTemplate: .llama3
        ),
    ]
}
