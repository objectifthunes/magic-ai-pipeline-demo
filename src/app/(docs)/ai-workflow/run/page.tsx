import Link from 'next/link'
import { ExportPage } from '@/components/ExportPage'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { findExport } from '@/components/exports'

const e = findExport('/ai-workflow/run/')!

const SIG = `function runWorkflow(
  workflow: Workflow,
  registry: CapabilityRegistry,
  inputs: Record<string, unknown>,
  opts?: RunOptions,
): Promise<WorkflowResult>

interface RunOptions {
  signal?: AbortSignal
  onStepStart?: (stepId: string) => void
  onStepDone?:  (result: StepResult) => void
}
interface WorkflowResult {
  outputs: Record<string, unknown>            // your declared output map, resolved
  steps:   Record<string, StepResult>          // every step's raw result, by id
}
interface StepResult { stepId: string; provider: string; output: unknown; usage?: unknown; cost?: unknown }`

const USE = `import { runWorkflow } from '@objectifthunes/ai-workflow'

const { outputs, steps } = await runWorkflow(workflow, registry, { brief: 'soft rain at dusk' }, {
  onStepStart: (id) => console.log('▶', id),
  onStepDone:  (r)  => console.log('✓', r.stepId, 'via', r.provider),
  signal: controller.signal,
})

console.log(outputs)   // → { coverUrl: 'https://…', audioUrl: 'https://…' }`

const FLOW = `// what runWorkflow does, in order:
1. validateWorkflow(workflow, registry.snapshot())   // re-validate or throw AiError
2. topoSort(steps)                                    // dependency order from the refs
3. for each step:  resolveParams(step.params, ctx)    // {{ … }} → real values
                   callPort(registry, capability, provider, resolved)
                   ctx.steps[id] = { output }          // available to later steps
4. resolve the output map the same way → outputs`

export default async function Page() {
  return (
    <ExportPage group={e.group} title="runWorkflow" lede={e.lede}>
      <p className="doc-p">
        The runner. It re-validates, derives execution order from the references (no manual <code>dependsOn</code>),
        resolves each step&apos;s params against the inputs and prior outputs, and calls the port the registry
        resolves for that capability. It streams progress through <code>onStepStart</code> / <code>onStepDone</code>{' '}
        — exactly the trace the{' '}
        <Link href="/studio/" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Studio</Link>{' '}
        renders live.
      </p>

      <Source code={SIG} lang="ts" label="SIGNATURE" />
      <Source code={FLOW} lang="ts" label="EXECUTION ORDER" />
      <Source code={USE} label="USAGE" />

      <Notes>
        <p>
          A step&apos;s output is stored under <code>{'{ output }'}</code>, which is why references read{' '}
          <code>{'{{ steps.<id>.output.<field> }}'}</code>. Passing a <code>signal</code> lets you abort a long
          pipeline between steps; the runner checks it before each one and throws an <code>AiError</code> with
          code <code>aborted</code>.
        </p>
      </Notes>
    </ExportPage>
  )
}
