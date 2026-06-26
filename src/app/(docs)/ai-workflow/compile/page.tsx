import Link from 'next/link'
import { ExportPage } from '@/components/ExportPage'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { findExport } from '@/components/exports'

const e = findExport('/ai-workflow/compile/')!

const SIG = `function compileWorkflow(
  nl: string,                    // the natural-language goal
  snapshot: RegistrySnapshot,    // what's available — constrains the model
  textGen: TextGenPort,          // any registered text provider
  opts?: { maxAttempts?: number },
): Promise<Workflow>             // throws AiError if it can't produce a valid one

// The prompt the model sees is built from the snapshot:
function buildAuthoringPrompt(snapshot): { system: string; workflowJsonSchema: Record<string, unknown> }`

const USE = `import { compileWorkflow, validateWorkflow } from '@objectifthunes/ai-workflow'

const workflow = await compileWorkflow(
  'AI UGC video from a product concept: script, keyframe, animate, store',
  registry.snapshot(),
  registry.get('text'),
)

// compileWorkflow validates internally and repairs; it returns only valid output.
// You can re-check to be sure before persisting:
const check = validateWorkflow(workflow, registry.snapshot())`

const BYOK = `// The browser BYOK path the Studio uses — the visitor's key, the visitor's tokens.
import Anthropic from '@anthropic-ai/sdk'
import { createAnthropicTextProvider } from '@objectifthunes/provider-anthropic'

const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
const port = createAnthropicTextProvider({ client })          // inject the client

const workflow = await compileWorkflow(goal, snapshot, port)  // real, live authoring`

export default async function Page() {
  return (
    <ExportPage group={e.group} title="compileWorkflow" lede={e.lede}>
      <p className="doc-p">
        The magic step: one English sentence becomes a valid workflow. It builds an authoring prompt from the
        registry snapshot — so the model can only reference capabilities that actually exist — asks a{' '}
        <code>TextGenPort</code> for JSON, validates the reply, and feeds any problems back for repair, up to{' '}
        <code>maxAttempts</code>. It returns only a workflow that passes <code>validateWorkflow</code>, or
        throws an <code>AiError</code>.
      </p>

      <Source code={SIG} lang="ts" label="SIGNATURE" />
      <Source code={USE} label="SERVER-SIDE" />

      <div>
        <h2 className="doc-h2">Bring your own key</h2>
        <p className="doc-p">
          Because <code>compileWorkflow</code> takes a port — not a vendor — the browser and the server run
          identical code. Inject a browser Anthropic client and the same call authors a workflow live. That is
          exactly what the{' '}
          <Link href="/studio/" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Studio</Link>{' '}
          does when you paste a key.
        </p>
      </div>
      <Source code={BYOK} label="BROWSER · BYOK" />

      <Notes>
        <p>
          The repair loop is the reason output is trustworthy: a model that emits a dangling reference or an
          unknown capability is told precisely which typed problem it produced and asked to fix it, rather than
          the caller getting back something that fails at run time.
        </p>
      </Notes>
    </ExportPage>
  )
}
