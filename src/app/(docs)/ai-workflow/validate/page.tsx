import Link from 'next/link'
import { ExportPage } from '@/components/ExportPage'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { findExport } from '@/components/exports'

const e = findExport('/ai-workflow/validate/')!

const SIG = `function validateWorkflow(doc: unknown, snapshot: RegistrySnapshot): ValidationResult

type ValidationResult =
  | { ok: true;  workflow: Workflow }
  | { ok: false; problems: WorkflowProblem[] }

interface WorkflowProblem {
  code: 'schema' | 'unknown_capability' | 'unknown_provider'
      | 'bad_reference' | 'cycle' | 'duplicate_id'
  message: string
  stepId?: string
}`

const USE = `import { validateWorkflow } from '@objectifthunes/ai-workflow'

const result = validateWorkflow(doc, registry.snapshot())
if (!result.ok) {
  for (const p of result.problems) {
    console.error(\`[\${p.code}]\${p.stepId ? ' ' + p.stepId : ''} — \${p.message}\`)
  }
  return
}
// result.workflow is now a fully-typed, registry-checked Workflow.`

const CHECKS = `// every check, in order — the first that can localize a step attaches stepId
schema             // Zod: shape, enums, required fields
duplicate_id       // two steps share an id
unknown_capability // no provider registered for step.capability
unknown_provider   // step pins a provider not registered for that capability
bad_reference      // {{ inputs.x }} / {{ steps.y… }} points at something undeclared
cycle              // steps form a dependency loop (only checked if refs are sound)`

export default async function Page() {
  return (
    <ExportPage group={e.group} title="validateWorkflow" lede={e.lede}>
      <p className="doc-p">
        The gate. Hand it any <code>unknown</code> and a registry snapshot, and it returns either a typed{' '}
        <code>Workflow</code> or the complete list of typed problems — never a thrown surprise, never a partial
        answer. This is the function the{' '}
        <Link href="/studio/" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Studio</Link>{' '}
        runs every time you click <strong>Validate</strong> or a “try breaking it” chip.
      </p>

      <Source code={SIG} lang="ts" label="SIGNATURE" />

      <div>
        <h2 className="doc-h2">What it checks</h2>
        <p className="doc-p">
          Six classes of error, each with its own <code>code</code>. Capability and provider checks are made
          against the live snapshot, so the same workflow can be valid in one deployment and invalid in
          another — correctly — depending on what&apos;s registered.
        </p>
      </div>
      <Source code={CHECKS} lang="ts" label="THE SIX PROBLEM CODES" />
      <Source code={USE} label="USAGE" />

      <Notes>
        <p>
          The runner calls <code>validateWorkflow</code> itself before executing, so a hand-edited workflow can
          never partially run. The cycle check is deliberately skipped when references are already broken — a
          dangling reference is the more actionable error to surface first.
        </p>
      </Notes>
    </ExportPage>
  )
}
