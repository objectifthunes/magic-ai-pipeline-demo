import { ExportPage } from '@/components/ExportPage'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { findExport } from '@/components/exports'

const e = findExport('/ai-core/overview/')!

const CAPS = `// The five capabilities — the whole vocabulary a workflow can speak.
type Capability = 'text' | 'image' | 'video' | 'audio' | 'storage'

// Every generative call returns the same envelope, whatever the provider.
interface CallResult<T> {
  output: T
  provider: string
  model?: string
  usage?: { inputTokens?: number; outputTokens?: number; units?: number; durationSec?: number }
  cost?: { amountUsd: number; breakdown?: Record<string, number> }
}

// Cancellation + idempotency travel with every call.
interface CallContext { signal?: AbortSignal; idempotencyKey?: string }`

const REGISTRY = `import { createRegistry } from '@objectifthunes/ai-core'

const registry = createRegistry()
registry.register(anthropicText, { default: true })
registry.register(replicateImage)

registry.has('image')            // → true
registry.get('text')             // → the default TextGenPort
registry.get('image', 'replicate')
registry.snapshot()
//   → { capabilities: { text: ['anthropic'], image: ['replicate'] },
//       defaults:     { text: 'anthropic' } }`

export default async function Page() {
  return (
    <ExportPage group={e.group} title="ai-core" lede={e.lede}>
      <p className="doc-p">
        <code>@objectifthunes/ai-core</code> is the contract the rest of the stack agrees on. It defines five
        capabilities, one result envelope, and a registry that resolves a capability to a concrete provider.
        It is pure TypeScript + Zod — no Node-only APIs — so it runs unchanged in a server, a worker, or a
        browser tab.
      </p>

      <Source code={CAPS} lang="ts" label="THE CONTRACT" />

      <div>
        <h2 className="doc-h2">The registry</h2>
        <p className="doc-p">
          <code>createRegistry()</code> returns a <code>CapabilityRegistry</code> with{' '}
          <code>register</code>, <code>get</code>, <code>has</code> and <code>snapshot</code>. The snapshot is
          the contract surface the workflow layer reads — it is what the validator checks against and what the
          authoring prompt describes to the model.
        </p>
      </div>
      <Source code={REGISTRY} lang="ts" label="createRegistry()" />

      <Notes>
        <p>
          Zod input/output schemas (<code>TextGenInputSchema</code>, <code>ImageGenOutputSchema</code>, …) ship
          with the package, so the workflow runner can validate a step&apos;s resolved params against the real
          capability schema before it calls the port — a second gate beneath the workflow validator.
        </p>
      </Notes>
    </ExportPage>
  )
}
