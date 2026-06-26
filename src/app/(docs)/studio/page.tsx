import { ExportPage } from '@/components/ExportPage'
import { Notes } from '@/components/Notes'
import { findExport } from '@/components/exports'
import { StudioMount } from '@/components/StudioMount'

const e = findExport('/studio/')!

export default function Page() {
  return (
    <ExportPage group={e.group} title="Workflow Studio" lede={e.lede}>
      <p className="doc-p">
        Everything in this Studio runs the real <code>@objectifthunes/ai-core</code> and{' '}
        <code>@objectifthunes/ai-workflow</code> packages in your browser. <strong>Validate</strong> and{' '}
        <strong>Run</strong> are deterministic, free, and never call a provider — Run executes against fake
        adapters that return tiny stub bytes and <code>*.invalid</code> URLs. The optional{' '}
        <strong>Compile with Claude</strong> button is the only thing that ever makes a network call, and only
        with a key <em>you</em> paste.
      </p>

      <StudioMount />

      <Notes>
        <p>
          <strong>Pick a sample</strong> to load a pre-authored workflow, then <strong>Validate</strong> it —
          you&apos;ll see it pass. Now use a “try breaking it” chip (or edit the JSON directly) and validate
          again: the engine returns typed <code>WorkflowProblem</code>s — <code>schema</code>,{' '}
          <code>unknown_capability</code>, <code>bad_reference</code>, <code>duplicate_id</code>,{' '}
          <code>cycle</code> — before anything runs.
        </p>
        <p>
          <strong>Run on fakes</strong> executes the validated workflow: watch the per-step trace go
          running → done with each step&apos;s resolved capability/provider, then see the resolved outputs.
          Bytes show as <code>image/png · 3 bytes</code>; URLs are fake links that aren&apos;t followed.
        </p>
        <p>
          <strong>Compile with Claude</strong> (bring your own key) calls the real <code>compileWorkflow</code>{' '}
          repair loop with a <code>provider-anthropic</code> port built over the browser SDK
          (<code>dangerouslyAllowBrowser: true</code>). It spends your tokens, never this project&apos;s, and
          the key lives in memory only.
        </p>
      </Notes>
    </ExportPage>
  )
}
