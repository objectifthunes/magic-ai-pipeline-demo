import { ExportPage } from '@/components/ExportPage'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { findExport } from '@/components/exports'

const e = findExport('/providers/elevenlabs/')!

const USE = `import { createRegistry } from '@objectifthunes/ai-core'
import { createElevenLabsAudioProvider } from '@objectifthunes/provider-elevenlabs'

const registry = createRegistry()
registry.register(
  createElevenLabsAudioProvider({ apiKey: process.env.ELEVENLABS_API_KEY }),
  { default: true },
)
//  capability: 'audio'   env: ELEVENLABS_API_KEY

// The audio port handles all three kinds the schema allows:
//   { "capability": "audio", "params": { "kind": "speech", "prompt": "...", "voiceId": "..." } }
//   { "capability": "audio", "params": { "kind": "music",  "prompt": "...", "durationSec": 60, "loop": true } }
//   { "capability": "audio", "params": { "kind": "sfx",    "prompt": "..." } }`

const SHAPE = `const port: AudioGenPort = {
  capability: 'audio',
  provider: 'elevenlabs',
  async generate(input, ctx) {
    const bytes = await synthesize(input.kind, input.prompt, input.voiceId, ctx?.signal)
    return { output: { bytes, contentType: 'audio/mpeg', durationSec: input.durationSec }, provider: 'elevenlabs' }
  },
}`

export default async function Page() {
  return (
    <ExportPage group={e.group} title="provider-elevenlabs" lede={e.lede}>
      <p className="doc-p">
        An <code>AudioGenPort</code> over ElevenLabs, covering the three audio kinds the contract defines:{' '}
        <code>speech</code>, <code>music</code> and <code>sfx</code>. Server-side — it returns audio bytes and
        carries a vendor key. These are illustrative snippets.
      </p>

      <Source code={USE} label="REGISTER · capability: audio · env: ELEVENLABS_API_KEY" />
      <Source code={SHAPE} lang="ts" label="THE PORT IT IMPLEMENTS" />

      <Notes>
        <p>
          The relaxing-soundscape and kids&apos;-book pipelines both lean on this port — one for a loopable
          instrumental, the other for warm narration — using the same <code>audio</code> capability with a
          different <code>kind</code>.
        </p>
      </Notes>
    </ExportPage>
  )
}
