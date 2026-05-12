import Foundation
@preconcurrency import llama

/// Thin Swift wrapper over llama.cpp's C API.
///
/// Runs on a dedicated actor so the heavy work never blocks the main thread.
/// Exposes an `AsyncStream<String>` of token deltas suitable for SwiftUI.
///
/// > Important: This file calls llama.cpp's C API directly. If you bump the
/// > `llama.cpp` Swift package version and a symbol has been renamed,
/// > fix the call site here.
actor LlamaEngine {
    struct Sampling: Sendable {
        var temperature: Float = 0.8
        var topP: Float = 0.95
        var topK: Int32 = 40
        var repeatPenalty: Float = 1.1
        var seed: UInt32 = .max  // .max = random
    }

    enum EngineError: Error, LocalizedError {
        case modelLoadFailed
        case contextCreationFailed
        case tokenizationFailed
        case generationFailed(String)

        var errorDescription: String? {
            switch self {
            case .modelLoadFailed: return "Failed to load model file."
            case .contextCreationFailed: return "Failed to create inference context."
            case .tokenizationFailed: return "Failed to tokenize prompt."
            case .generationFailed(let m): return "Generation failed: \(m)"
            }
        }
    }

    private let modelURL: URL
    private let template: ChatTemplate
    private let nCtx: Int32 = 2048
    private let nBatch: Int32 = 256
    private let nThreads: Int32

    private var model: OpaquePointer?
    private var ctx: OpaquePointer?
    private var vocab: OpaquePointer?
    private var sampler: OpaquePointer?

    init(modelURL: URL, template: ChatTemplate) {
        self.modelURL = modelURL
        self.template = template
        self.nThreads = Int32(max(2, ProcessInfo.processInfo.activeProcessorCount - 2))
    }

    deinit {
        if let sampler { llama_sampler_free(sampler) }
        if let ctx { llama_free(ctx) }
        if let model { llama_model_free(model) }
        llama_backend_free()
    }

    func load() throws {
        llama_backend_init()

        var modelParams = llama_model_default_params()
        // On iOS, Metal is enabled by default in recent llama.cpp builds.
        modelParams.n_gpu_layers = 99

        guard let m = llama_model_load_from_file(modelURL.path, modelParams) else {
            throw EngineError.modelLoadFailed
        }
        self.model = m
        self.vocab = llama_model_get_vocab(m)

        var ctxParams = llama_context_default_params()
        ctxParams.n_ctx = UInt32(nCtx)
        ctxParams.n_batch = UInt32(nBatch)
        ctxParams.n_threads = nThreads
        ctxParams.n_threads_batch = nThreads

        guard let c = llama_init_from_model(m, ctxParams) else {
            throw EngineError.contextCreationFailed
        }
        self.ctx = c
    }

    /// Generates a reply, streaming token text as it arrives.
    func generate(
        messages: [ChatMessage],
        sampling: Sampling = Sampling(),
        maxTokens: Int = 512
    ) -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            Task {
                do {
                    try await self.runGeneration(
                        messages: messages,
                        sampling: sampling,
                        maxTokens: maxTokens,
                        emit: { continuation.yield($0) }
                    )
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }

    // MARK: - Internals

    private func runGeneration(
        messages: [ChatMessage],
        sampling: Sampling,
        maxTokens: Int,
        emit: @Sendable (String) -> Void
    ) throws {
        guard let ctx, let vocab else { throw EngineError.contextCreationFailed }

        configureSampler(sampling)

        let prompt = renderPrompt(messages: messages, template: template)
        var tokens = try tokenize(prompt, addBOS: true)

        // Make room in the KV cache if needed by clearing it for now.
        // (A smarter implementation would keep the prefix across turns.)
        llama_kv_self_clear(ctx)

        // Feed the prompt in batches.
        var pos: Int32 = 0
        try tokens.withUnsafeMutableBufferPointer { buf in
            var idx = 0
            while idx < buf.count {
                let chunk = min(Int(nBatch), buf.count - idx)
                var batch = llama_batch_get_one(buf.baseAddress!.advanced(by: idx), Int32(chunk))
                if llama_decode(ctx, batch) != 0 {
                    throw EngineError.generationFailed("decode failed during prompt")
                }
                pos += Int32(chunk)
                idx += chunk
            }
        }

        // Sample until EOS or maxTokens.
        var produced = 0
        var nextToken = sampleNext()
        while produced < maxTokens {
            if llama_vocab_is_eog(vocab, nextToken) { break }

            if let piece = tokenToString(nextToken) {
                emit(piece)
            }

            var single = nextToken
            var batch = withUnsafeMutablePointer(to: &single) {
                llama_batch_get_one($0, 1)
            }
            if llama_decode(ctx, batch) != 0 {
                throw EngineError.generationFailed("decode failed during sampling")
            }
            pos += 1
            produced += 1
            nextToken = sampleNext()

            try Task.checkCancellation()
        }
    }

    private func configureSampler(_ s: Sampling) {
        if let sampler { llama_sampler_free(sampler) }
        let chain = llama_sampler_chain_init(llama_sampler_chain_default_params())!
        llama_sampler_chain_add(chain, llama_sampler_init_top_k(s.topK))
        llama_sampler_chain_add(chain, llama_sampler_init_top_p(s.topP, 1))
        llama_sampler_chain_add(chain, llama_sampler_init_temp(s.temperature))
        llama_sampler_chain_add(chain, llama_sampler_init_dist(s.seed))
        sampler = chain
    }

    private func sampleNext() -> llama_token {
        guard let ctx, let sampler else { return 0 }
        let tok = llama_sampler_sample(sampler, ctx, -1)
        llama_sampler_accept(sampler, tok)
        return tok
    }

    private func tokenize(_ text: String, addBOS: Bool) throws -> [llama_token] {
        guard let vocab else { throw EngineError.tokenizationFailed }
        let utf8 = Array(text.utf8CString)
        let maxTokens = Int32(utf8.count + (addBOS ? 1 : 0))
        var out = [llama_token](repeating: 0, count: Int(maxTokens))
        let n = utf8.withUnsafeBufferPointer { buf in
            llama_tokenize(vocab, buf.baseAddress, Int32(utf8.count - 1), &out, maxTokens, addBOS, true)
        }
        guard n >= 0 else { throw EngineError.tokenizationFailed }
        return Array(out.prefix(Int(n)))
    }

    private func tokenToString(_ token: llama_token) -> String? {
        guard let vocab else { return nil }
        var buf = [CChar](repeating: 0, count: 64)
        let n = llama_token_to_piece(vocab, token, &buf, Int32(buf.count), 0, true)
        guard n > 0 else { return nil }
        return String(cString: buf)
    }

    // MARK: - Prompt templates

    private func renderPrompt(messages: [ChatMessage], template: ChatTemplate) -> String {
        switch template {
        case .chatML: return renderChatML(messages)
        case .llama3: return renderLlama3(messages)
        case .mistral: return renderMistral(messages)
        }
    }

    private func renderChatML(_ messages: [ChatMessage]) -> String {
        var out = ""
        for m in messages {
            out += "<|im_start|>\(m.role.rawValue)\n\(m.content)<|im_end|>\n"
        }
        out += "<|im_start|>assistant\n"
        return out
    }

    private func renderLlama3(_ messages: [ChatMessage]) -> String {
        var out = "<|begin_of_text|>"
        for m in messages {
            out += "<|start_header_id|>\(m.role.rawValue)<|end_header_id|>\n\n\(m.content)<|eot_id|>"
        }
        out += "<|start_header_id|>assistant<|end_header_id|>\n\n"
        return out
    }

    private func renderMistral(_ messages: [ChatMessage]) -> String {
        // Mistral instruct: collapses system into the first user turn.
        var out = "<s>"
        var systemPrefix = ""
        var pendingUser: String?

        for m in messages {
            switch m.role {
            case .system:
                systemPrefix = m.content + "\n\n"
            case .user:
                pendingUser = systemPrefix + m.content
                systemPrefix = ""
            case .assistant:
                if let user = pendingUser {
                    out += "[INST] \(user) [/INST] \(m.content)</s>"
                    pendingUser = nil
                }
            }
        }
        if let user = pendingUser {
            out += "[INST] \(user) [/INST]"
        }
        return out
    }
}
