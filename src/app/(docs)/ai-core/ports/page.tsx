import { ExportPage } from '@/components/ExportPage'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { findExport } from '@/components/exports'

const e = findExport('/ai-core/ports/')!

const SYNC = `interface TextGenPort {
  readonly capability: 'text'
  readonly provider: string
  generate(input: TextGenInput, ctx?: CallContext): Promise<CallResult<TextGenOutput>>
}
//   TextGenInput  = { messages: { role; content }[]; outputSchema?; maxTokens?; temperature? }
//   TextGenOutput = { text?: string; data?: unknown }   // data when an outputSchema is requested

interface ImageGenPort {
  readonly capability: 'image'
  readonly provider: string
  generate(input: ImageGenInput, ctx?: CallContext): Promise<CallResult<ImageGenOutput>>
}
//   ImageGenInput  = { prompt; aspectRatio?; inputImages?; quality? }
//   ImageGenOutput = { bytes: Uint8Array; contentType; width?; height? }

interface AudioGenPort {
  readonly capability: 'audio'
  readonly provider: string
  generate(input: AudioGenInput, ctx?: CallContext): Promise<CallResult<AudioGenOutput>>
}
//   AudioGenInput  = { kind: 'sfx' | 'music' | 'speech'; prompt; durationSec?; instrumental?; loop?; voiceId? }
//   AudioGenOutput = { bytes: Uint8Array; contentType; durationSec? }`

const ASYNC = `// Video is asynchronous by design — submit returns a handle, not a result.
interface VideoGenPort {
  readonly capability: 'video'
  readonly provider: string
  submit(input: VideoGenInput, ctx?: CallContext): Promise<VideoJobHandle>
}
interface VideoJobHandle {
  readonly id: string
  result(): Promise<CallResult<VideoGenOutput>>   // resolved by webhook or polling
}
//   VideoGenInput  = { prompt; firstFrameUrl?; durationSec?; resolution?; aspectRatio?: '16:9' | '9:16'; generateAudio?; … }
//   VideoGenOutput = { url: string; durationSec? }

// Storage is the one port that both writes and signs.
interface StoragePort {
  readonly capability: 'storage'
  readonly provider: string
  put(input: { key; bytes: Uint8Array; contentType }, ctx?: CallContext): Promise<{ url: string }>
  presign(key: string, expiresSec?: number): Promise<string>
}`

export default async function Page() {
  return (
    <ExportPage group={e.group} title="Ports" lede={e.lede}>
      <p className="doc-p">
        Five interfaces, each with a <code>capability</code> discriminant, a <code>provider</code> name, and a
        single method. Every input and output has a matching Zod schema exported alongside it, so the same
        shapes validate at the workflow boundary and at the port boundary.
      </p>

      <Source code={SYNC} lang="ts" label="TEXT · IMAGE · AUDIO" />

      <div>
        <h2 className="doc-h2">The async video seam &amp; storage</h2>
        <p className="doc-p">
          Video generation can take minutes, so <code>VideoGenPort.submit</code> returns a{' '}
          <code>VideoJobHandle</code> whose <code>result()</code> resolves later — the runner awaits it
          transparently. Storage is the port whose <code>url</code> output is designed to be referenced by
          downstream steps.
        </p>
      </div>
      <Source code={ASYNC} lang="ts" label="VIDEO · STORAGE" />

      <Notes>
        <p>
          Because the ports are structural, a fake adapter is trivial to write — the Studio&apos;s Run uses a
          fake for all five so a pipeline executes end-to-end with zero cost. A real adapter has the exact same
          shape; only the body differs.
        </p>
      </Notes>
    </ExportPage>
  )
}
