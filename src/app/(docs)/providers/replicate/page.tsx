import { ExportPage } from '@/components/ExportPage'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { findExport } from '@/components/exports'

const e = findExport('/providers/replicate/')!

const USE = `import { createRegistry } from '@objectifthunes/ai-core'
import { createReplicateImageProvider } from '@objectifthunes/provider-replicate'

const registry = createRegistry()
registry.register(
  createReplicateImageProvider({ apiToken: process.env.REPLICATE_API_TOKEN }),
  { default: true },
)
//  capability: 'image'   env: REPLICATE_API_TOKEN

// A workflow step then just asks for the capability:
//   { "id": "cover", "capability": "image", "params": { "prompt": "...", "aspectRatio": "1:1" } }`

const SHAPE = `// It is an ImageGenPort — same shape as every other image adapter.
const port: ImageGenPort = {
  capability: 'image',
  provider: 'replicate',
  async generate(input, ctx) {
    const out = await runModel(input.prompt, input.aspectRatio, input.quality, ctx?.signal)
    return { output: { bytes: out, contentType: 'image/png' }, provider: 'replicate', usage: { units: 1 } }
  },
}`

export default async function Page() {
  return (
    <ExportPage group={e.group} title="provider-replicate" lede={e.lede}>
      <p className="doc-p">
        An <code>ImageGenPort</code> backed by Replicate-hosted models. It runs server-side — it holds a vendor
        token and returns raw bytes — so you register it behind your own API, never in the browser bundle. The
        snippets here are illustrative; this demo only imports the browser-safe packages.
      </p>

      <Source code={USE} label="REGISTER · capability: image · env: REPLICATE_API_TOKEN" />
      <Source code={SHAPE} lang="ts" label="THE PORT IT IMPLEMENTS" />

      <Notes>
        <p>
          Because the workflow only names the <code>image</code> capability, swapping Replicate for another
          image provider is a one-line registration change — no pipeline, prompt or validation touches the
          vendor name.
        </p>
      </Notes>
    </ExportPage>
  )
}
