# LocalChat — On-device LLM chat for iOS

A native SwiftUI iOS app that runs an LLM **entirely on-device** using
`llama.cpp`. No cloud, no API keys, no telemetry.

Targeted at **iPhone 14 / iOS 17+**. Will run faster on newer devices.

## What you get

- SwiftUI chat UI with streaming token output
- Multiple persisted conversations (SwiftData)
- First-launch model download with progress
- Swappable model — change the URL in `ModelCatalog.swift`
- Default model: **Dolphin 3.0 Llama 3.2 3B Instruct (Q4_K_M)** (~2 GB)

## Setup (one-time, on your Mac)

### 1. Create the Xcode project

1. Open **Xcode → File → New → Project → iOS → App**
2. Product name: `LocalChat`
3. Interface: **SwiftUI**, Language: **Swift**, Storage: **SwiftData**
4. Minimum deployment: **iOS 17.0**
5. Save it somewhere (e.g. `~/Developer/LocalChat`)

### 2. Drop in these source files

Replace the auto-generated files with the ones from this `LocalChat/`
directory. Drag the whole `LocalChat/` folder into Xcode's project
navigator and check **"Copy items if needed"**.

### 3. Add the llama.cpp Swift package

1. In Xcode: **File → Add Package Dependencies…**
2. URL: `https://github.com/ggml-org/llama.cpp`
3. Add the **llama** library product to your `LocalChat` target.

> If the upstream Swift package isn't tagged in a way Xcode likes, the
> fallback is to clone `llama.cpp` locally and add it as a local SPM
> package. See `Engine/LlamaEngine.swift` for the import line.

### 4. Configure capabilities

In your target's **Signing & Capabilities** tab, add:

- **Increased Memory Limit** (Capabilities → "+" → Increased Memory Limit).
  Required so iOS lets you allocate >~2 GB for the model.

In `Info.plist` add (or set in the target's Info tab):

- `NSAppTransportSecurity` → allow HTTPS (default is fine; Hugging Face is HTTPS).

### 5. Build & run on your iPhone

- Plug in your iPhone 14
- Select it as the run destination
- ⌘R to build and run
- On first launch the app will download ~2 GB. Use Wi-Fi.

## Where to change things

| What | Where |
|---|---|
| Model URL / name | `Engine/ModelCatalog.swift` |
| System prompt | `ViewModels/ChatViewModel.swift` (`systemPrompt`) |
| Sampling (temperature, top-p) | `Engine/LlamaEngine.swift` (`Sampling` struct) |
| Context window size | `Engine/LlamaEngine.swift` (`nCtx`) |

## Memory tuning for iPhone 14

In `LlamaEngine.swift`:

```swift
nCtx = 2048      // context window; lower = less RAM
nBatch = 256     // prompt processing batch; lower = less RAM
```

If the app crashes on launch with a memory warning, drop `nCtx` to 1024.

## Caveats

- llama.cpp's Swift Package surface area changes. The wrapper in
  `LlamaEngine.swift` uses the public C API via the `llama` module — if a
  symbol has been renamed upstream, fix it locally (Xcode will tell you).
- The first prompt is slow (model loading + warmup). Subsequent tokens
  stream in real time.
- 3B-class models are not GPT-4. Expect short, sometimes wrong answers.
