/**
 * A registry wired entirely to FAKE adapters — but registered under the REAL
 * provider names (anthropic, openai, replicate, elevenlabs, kie, r2), with
 * several providers per capability. That's the whole point of the demo:
 * provider-agnosticism. A workflow step pins `provider: "replicate"` or
 * `provider: "openai"` for the same `capability: "image"`, and the engine routes
 * accordingly. Swap the provider name and nothing else changes.
 *
 * The Workflow Studio's "Run" button executes the REAL ai-workflow engine
 * (validate → topo-sort → resolve references → call ports) against these fakes,
 * so a run never touches a real provider, never needs a key, never costs a cent.
 * Bytes are tiny file-signature stubs; URLs point at `*.invalid` hosts that
 * resolve nowhere on purpose.
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

/** The providers the demo registry knows about, grouped by capability. The
 * first in each list is the registered default. Samples pin explicit providers,
 * so the mix is always visible. */
export const DEMO_PROVIDERS = {
  text: ['anthropic', 'openai'],
  image: ['replicate', 'openai'],
  audio: ['elevenlabs'],
  video: ['kie', 'replicate'],
  storage: ['r2'],
} as const satisfies Record<string, readonly string[]>

const fakeText = (provider: string): TextGenPort => ({
  capability: 'text',
  provider,
  async generate(input) {
    const last = input.messages[input.messages.length - 1]?.content ?? ''
    return {
      output: { text: `(${provider} · demo) ${last.slice(0, 80)}` },
      provider,
      usage: { inputTokens: 64, outputTokens: 32 },
    }
  },
})

const fakeImage = (provider: string): ImageGenPort => ({
  capability: 'image',
  provider,
  async generate() {
    // PNG file signature — three bytes is enough to prove "bytes flowed".
    return {
      output: { bytes: new Uint8Array([137, 80, 78]), contentType: 'image/png', width: 1024, height: 1024 },
      provider,
      usage: { units: 1 },
    }
  },
})

const fakeAudio = (provider: string): AudioGenPort => ({
  capability: 'audio',
  provider,
  async generate(input) {
    // MP3 frame-sync bytes.
    return {
      output: { bytes: new Uint8Array([255, 251]), contentType: 'audio/mpeg', durationSec: input.durationSec ?? 30 },
      provider,
    }
  },
})

const fakeVideo = (provider: string): VideoGenPort => ({
  capability: 'video',
  provider,
  async submit() {
    return {
      id: `fake-${provider}-vid`,
      async result() {
        return {
          output: { url: `https://example.invalid/${provider}/clip.mp4`, durationSec: 5 },
          provider,
        }
      },
    }
  },
})

const fakeStorage = (provider: string): StoragePort => ({
  capability: 'storage',
  provider,
  async put(input) {
    return { url: `https://cdn.example.invalid/${provider}/${input.key}` }
  },
  async presign(key) {
    return `https://cdn.example.invalid/${provider}/${key}?sig=demo`
  },
})

/** Build a fresh registry with every fake port registered under its real
 * provider name. The first provider in each DEMO_PROVIDERS list becomes the
 * capability default. */
export function createFakeRegistry(): CapabilityRegistry {
  const registry = createRegistry()
  const factories = {
    text: fakeText,
    image: fakeImage,
    audio: fakeAudio,
    video: fakeVideo,
    storage: fakeStorage,
  } as const
  for (const [cap, providers] of Object.entries(DEMO_PROVIDERS)) {
    const make = factories[cap as keyof typeof factories]
    providers.forEach((provider, i) => registry.register(make(provider), { default: i === 0 }))
  }
  return registry
}
