import Foundation
import Observation

@Observable
@MainActor
final class ModelStore {
    enum State {
        case needsDownload
        case downloading(progress: Double, bytesWritten: Int64, totalBytes: Int64)
        case ready(URL)
        case failed(String)
    }

    private(set) var state: State = .needsDownload
    var selected: ModelDescriptor = ModelCatalog.default

    private var downloadTask: Task<Void, Never>?

    /// Resolves to a local file URL for the selected model; downloads if missing.
    func prepare() async {
        let fileURL = Self.localURL(for: selected)
        if FileManager.default.fileExists(atPath: fileURL.path) {
            state = .ready(fileURL)
            return
        }
        state = .needsDownload
    }

    func startDownload() {
        downloadTask?.cancel()
        downloadTask = Task { await downloadSelected() }
    }

    func cancelDownload() {
        downloadTask?.cancel()
        downloadTask = nil
        state = .needsDownload
    }

    private func downloadSelected() async {
        let descriptor = selected
        let destination = Self.localURL(for: descriptor)
        state = .downloading(progress: 0, bytesWritten: 0, totalBytes: descriptor.approximateBytes)

        do {
            try FileManager.default.createDirectory(
                at: destination.deletingLastPathComponent(),
                withIntermediateDirectories: true
            )

            let (bytes, response) = try await URLSession.shared.bytes(from: descriptor.downloadURL)
            let expected = max(response.expectedContentLength, descriptor.approximateBytes)

            FileManager.default.createFile(atPath: destination.path, contents: nil)
            let handle = try FileHandle(forWritingTo: destination)
            defer { try? handle.close() }

            var buffer = Data()
            buffer.reserveCapacity(1 << 16)
            var written: Int64 = 0
            var lastUIUpdate = Date.distantPast

            for try await byte in bytes {
                buffer.append(byte)
                if buffer.count >= 1 << 16 {
                    try handle.write(contentsOf: buffer)
                    written += Int64(buffer.count)
                    buffer.removeAll(keepingCapacity: true)

                    if Date().timeIntervalSince(lastUIUpdate) > 0.1 {
                        let progress = expected > 0 ? Double(written) / Double(expected) : 0
                        state = .downloading(progress: progress, bytesWritten: written, totalBytes: expected)
                        lastUIUpdate = Date()
                    }
                    try Task.checkCancellation()
                }
            }
            if !buffer.isEmpty {
                try handle.write(contentsOf: buffer)
                written += Int64(buffer.count)
            }
            state = .ready(destination)
        } catch is CancellationError {
            try? FileManager.default.removeItem(at: destination)
            state = .needsDownload
        } catch {
            try? FileManager.default.removeItem(at: destination)
            state = .failed(error.localizedDescription)
        }
    }

    static func localURL(for descriptor: ModelDescriptor) -> URL {
        let docs = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        return docs.appendingPathComponent("models", isDirectory: true)
            .appendingPathComponent("\(descriptor.id).gguf")
    }
}
