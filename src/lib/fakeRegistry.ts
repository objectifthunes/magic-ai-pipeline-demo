/**
 * A registry wired entirely to FAKE adapters. The Workflow Studio's "Run"
 * button executes the REAL ai-workflow engine (validate → topo-sort → resolve
 * references → call ports) against these fakes, so a run never touches a real
 * provider, never needs a key, and never costs anything. The bytes are tiny
 * file-signature stubs; the URLs point at `*.invalid` hosts that resolve
 * nowhere on purpose.
 *
 * The ports are structurally compatible with ai-core's port interfaces; we
 * import the interface types and satisfy them directly (no `any`).
 */
import {
  createRegistry,
  type CapabilityRegistry,
  type TextGenPort,
  type ImageGenPort,
  type AudioGenPort,
  type VideoGenPort,
  type StoragePort,
} from '@objectifthunes/ai-core'

const fakeText: TextGenPort = {
  capability: 'text',
  provider: 'fake-text',
  async generate(input) {
    const last = input.messages[input.messages.length - 1]?.content ?? ''
    return {
      output: { text: `(demo) ${last.slice(0, 80)}` },
      provider: 'fake-text',
      usage: { inputTokens: 64, outputTokens: 32 },
    }
  },
}

const fakeImage: ImageGenPort = {
  capability: 'image',
  provider: 'fake-image',
  async generate() {
    // PNG file signature — three bytes is enough to prove "bytes flowed".
    return {
      output: { bytes: new Uint8Array([137, 80, 78]), contentType: 'image/png', width: 1024, height: 1024 },
      provider: 'fake-image',
      usage: { units: 1 },
    }
  },
}

const fakeAudio: AudioGenPort = {
  capability: 'audio',
  provider: 'fake-audio',
  async generate(input) {
    // MP3 frame-sync bytes.
    return {
      output: { bytes: new Uint8Array([255, 251]), contentType: 'audio/mpeg', durationSec: input.durationSec ?? 30 },
      provider: 'fake-audio',
    }
  },
}

const fakeVideo: VideoGenPort = {
  capability: 'video',
  provider: 'fake-video',
  async submit() {
    return {
      id: 'fake-vid-1',
      async result() {
        return {
          output: { url: 'https://example.invalid/fake-video.mp4', durationSec: 5 },
          provider: 'fake-video',
        }
      },
    }
  },
}

const fakeStorage: StoragePort = {
  capability: 'storage',
  provider: 'fake-r2',
  async put(input) {
    return { url: `https://cdn.example.invalid/${input.key}` }
  },
  async presign(key) {
    return `https://cdn.example.invalid/${key}?sig=demo`
  },
}

/** Build a fresh registry with every fake port registered as its capability's default. */
export function createFakeRegistry(): CapabilityRegistry {
  const registry = createRegistry()
  registry.register(fakeText, { default: true })
  registry.register(fakeImage, { default: true })
  registry.register(fakeAudio, { default: true })
  registry.register(fakeVideo, { default: true })
  registry.register(fakeStorage, { default: true })
  return registry
}
