import Link from 'next/link'
import { ExportPage } from '@/components/ExportPage'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { findExport } from '@/components/exports'

const e = findExport('/getting-started/')!

const INSTALL = `# the contract + the engine
pnpm add @objectifthunes/ai-core @objectifthunes/ai-workflow

# the text provider — also the browser BYOK seam
pnpm add @objectifthunes/provider-anthropic @anthropic-ai/sdk`

const REGISTER = `import { createRegistry } from '@objectifthunes/ai-core'
import { createAnthropicTextProvider } from '@objectifthunes/provider-anthropic'

// A registry maps a capability ("text", "image", …) to one or more providers.
// The workflow only ever names capabilities — never a vendor — so you can swap
// providers without touching a single pipeline.
const registry = createRegistry()

registry.register(
  createAnthropicTextProvider({ apiKey: process.env.ANTHROPIC_API_KEY }),
  { default: true },
)

// register(port, { default }) — the default is what get(cap) returns with no
// provider argument. Register image/audio/video/storage adapters the same way.`

const RUN = `import { compileWorkflow, validateWorkflow, runWorkflow } from '@objectifthunes/ai-workflow'

const snapshot = registry.snapshot()

// author a Workflow from one sentence (or skip this and write the JSON yourself)
const workflow = await compileWorkflow(
  'Write a short product hook and store it',
  snapshot,
  registry.get('text'),
)

// the gate — refuse anything malformed before spending a token
const check = validateWorkflow(workflow, snapshot)
if (!check.ok) {
  for (const p of check.problems) console.error(p.code, p.stepId, p.message)
  throw new Error('invalid workflow')
}

// run it: topo-sort → resolve references → call each port through the registry
const { outputs, steps } = await runWorkflow(workflow, registry, { concept: 'a bamboo toothbrush' })
console.log(outputs)`

export default async function Page() {
  return (
    <ExportPage group={e.group} title="Getting started" lede={e.lede}>
      <p className="doc-p">
        Two packages do the work: <code>@objectifthunes/ai-core</code> is the capability contract (typed ports
        + a registry), and <code>@objectifthunes/ai-workflow</code> is the engine (schema, validator, runner,
        and the English-to-JSON compiler). Both are pure TypeScript + Zod with no Node-only dependencies, so
        they run in Node <em>and</em> in the browser — which is exactly how the{' '}
        <Link href="/studio/" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Workflow Studio</Link>{' '}
        on this site runs them live.
      </p>

      <Source code={INSTALL} lang="bash" label="INSTALL" />

      <div>
        <h2 className="doc-h2">1 · Register the providers you have</h2>
        <p className="doc-p">
          A provider is a thin adapter that implements one ai-core port for one vendor. Register the ones you
          want; the snapshot you hand the validator and the compiler reflects exactly what is available.
        </p>
      </div>
      <Source code={REGISTER} label="REGISTER" />

      <div>
        <h2 className="doc-h2">2 · Compile, validate, run</h2>
        <p className="doc-p">
          Author from English, gate on the validator, then run. Every reference (<code>{'{{ inputs.x }}'}</code>,{' '}
          <code>{'{{ steps.id.output.y }}'}</code>) is resolved at run time as the engine walks the steps in
          dependency order.
        </p>
      </div>
      <Source code={RUN} label="COMPILE · VALIDATE · RUN" />

      <Notes>
        <p>
          Restricted access: the <code>@objectifthunes/*</code> packages are private. CI authenticates with an{' '}
          <code>NPM_TOKEN</code> repo secret written into <code>.npmrc</code> before install — see the Pages
          workflow in this repo. Locally, export the same token before <code>pnpm install</code>.
        </p>
        <p>
          You don&apos;t need every provider to start. Register only <code>provider-anthropic</code> and you can
          already compile, validate and run any text-only pipeline. Add image/audio/video/storage adapters as
          you need them — the workflow JSON never changes.
        </p>
      </Notes>
    </ExportPage>
  )
}
