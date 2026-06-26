import Link from 'next/link'
import { ExportPage } from '@/components/ExportPage'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { findExport } from '@/components/exports'

const e = findExport('/ai-core/registry/')!

const API = `interface CapabilityRegistry {
  register(port: AnyPort, opts?: { default?: boolean }): void
  get<C extends Capability>(cap: C, provider?: string): PortFor<C>
  has(cap: Capability, provider?: string): boolean
  snapshot(): RegistrySnapshot
}
interface RegistrySnapshot {
  capabilities: Record<string, string[]>   // capability → provider names
  defaults: Record<string, string>          // capability → default provider
}`

const USE = `import { createRegistry } from '@objectifthunes/ai-core'

const registry = createRegistry()
registry.register(anthropicText, { default: true })   // text → anthropic (default)
registry.register(replicateImage, { default: true })  // image → replicate (default)
registry.register(elevenlabsAudio, { default: true })
registry.register(kieVideo, { default: true })
registry.register(r2Storage, { default: true })

// get(cap) returns the default; get(cap, provider) pins a specific one.
const text = registry.get('text')
const img  = registry.get('image', 'replicate')

// snapshot() is the single source of truth handed to the workflow layer.
const snapshot = registry.snapshot()`

export default async function Page() {
  return (
    <ExportPage group={e.group} title="Registry" lede={e.lede}>
      <p className="doc-p">
        The registry is the indirection that makes the whole stack provider-agnostic. Adapters register against
        a capability; the workflow asks for a capability; the registry resolves the two. A workflow step may
        pin a <code>provider</code> explicitly, or omit it and take the capability&apos;s default.
      </p>

      <Source code={API} lang="ts" label="INTERFACE" />
      <Source code={USE} label="REGISTER · RESOLVE · SNAPSHOT" />

      <Notes>
        <p>
          <code>snapshot()</code> is deliberately tiny — just which providers exist per capability and which is
          default. It carries no secrets and no client objects, which is why it can be safely passed to the
          validator and serialized into the authoring prompt. See{' '}
          <Link href="/ai-workflow/validate/" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
            validateWorkflow
          </Link>{' '}
          for how the snapshot becomes a correctness check.
        </p>
      </Notes>
    </ExportPage>
  )
}
