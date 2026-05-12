import SwiftUI

struct ModelDownloadView: View {
    @Bindable var store: ModelStore

    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "brain.head.profile")
                .font(.system(size: 64))
                .foregroundStyle(.tint)

            VStack(spacing: 8) {
                Text("First-time setup")
                    .font(.title2.weight(.semibold))
                Text("Download a language model to run on this device. ~2 GB. Use Wi-Fi.")
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal)
            }

            Picker("Model", selection: $store.selected) {
                ForEach(ModelCatalog.all) { m in
                    Text(m.displayName).tag(m)
                }
            }
            .pickerStyle(.menu)
            .disabled(isDownloading)

            switch store.state {
            case .needsDownload, .failed:
                Button {
                    store.startDownload()
                } label: {
                    Label("Download model", systemImage: "arrow.down.circle.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .padding(.horizontal)

            case .downloading(let progress, let written, let total):
                VStack(spacing: 8) {
                    ProgressView(value: progress)
                    HStack {
                        Text(format(bytes: written) + " / " + format(bytes: total))
                        Spacer()
                        Text(String(format: "%.0f%%", progress * 100))
                    }
                    .font(.footnote.monospacedDigit())
                    .foregroundStyle(.secondary)
                    Button("Cancel", role: .destructive) { store.cancelDownload() }
                        .padding(.top, 4)
                }
                .padding(.horizontal)

            case .ready:
                EmptyView()
            }

            if case .failed(let message) = store.state {
                Text(message)
                    .font(.footnote)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }

            Spacer()
        }
        .padding(.top, 60)
    }

    private var isDownloading: Bool {
        if case .downloading = store.state { return true }
        return false
    }

    private func format(bytes: Int64) -> String {
        ByteCountFormatter.string(fromByteCount: bytes, countStyle: .file)
    }
}
