import Link from 'next/link'
import { ExportPage } from '@/components/ExportPage'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { findExport } from '@/components/exports'

const e = findExport('/architecture/')!

const PORT = `// A provider is just an object that satisfies a port interface.
// No base class, no framework — structural typing is the whole contract.
import type { ImageGenPort } from '@objectifthunes/ai-core'

export const replicateImage: ImageGenPort = {
  capability: 'image',
  provider: 'replicate',
  async generate(input, ctx) {
    const out = await callReplicate(input.prompt, input.aspectRatio, ctx?.signal)
    return { output: { bytes: out.bytes, contentType: 'image/png' }, provider: 'replicate' }
  },
}`

const LAYERS = `// 1 — SCHEMA: a Zod object. A workflow is data, not code.
const workflow = WorkflowSchema.parse(json)

// 2 — VALIDATOR: schema + registry awareness. Every failure is typed.
const result = validateWorkflow(workflow, registry.snapshot())
//   → { ok: true, workflow } | { ok: false, problems: WorkflowProblem[] }

// 3 — RUNNER: deterministic. Re-validates, topo-sorts, resolves refs, calls ports.
const { outputs, steps } = await runWorkflow(workflow, registry, inputs)`

export default async function Page() {
  return (
    <ExportPage group={e.group} title="Architecture" lede={e.lede}>
      <p className="doc-p">
        The stack is ports-and-adapters with a declarative engine on top. Two ideas carry the whole design: a
        capability is an interface (a <em>port</em>), and a workflow is data that only ever names capabilities.
        Everything else — which vendor, where it runs, how it&apos;s billed — is an adapter decision made at
        registration time.
      </p>

      <div>
        <h2 className="doc-h2">Ports &amp; adapters</h2>
        <p className="doc-p">
          <code>ai-core</code> defines five ports — <code>text</code>, <code>image</code>, <code>audio</code>,{' '}
          <code>video</code>, <code>storage</code>. An adapter implements one port for one vendor. The registry
          resolves <code>capability → provider</code>, so a workflow that asks for <code>image</code> doesn&apos;t
          know or care whether Replicate, a local model, or a fake answers it.
        </p>
      </div>
      <Source code={PORT} label="AN ADAPTER IS JUST AN OBJECT" />

      <div>
        <h2 className="doc-h2">The three-layer guarantee</h2>
        <p className="doc-p">
          A malformed pipeline can never reach a provider. The schema rejects the wrong shape; the validator
          rejects unknown capabilities/providers, dangling references and cycles against the live registry
          snapshot; and the runner re-validates before it executes a single step. Each layer is pure and
          deterministic — you can prove a workflow correct with no network at all (which is what the{' '}
          <Link href="/studio/" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Studio</Link>{' '}
          does live).
        </p>
      </div>
      <Source code={LAYERS} label="SCHEMA → VALIDATOR → RUNNER" />

      <div>
        <h2 className="doc-h2">Why it&apos;s reusable across products</h2>
        <ul className="doc-ul">
          <li className="doc-li"><strong>Relaxing-music app</strong> — audio + image + storage: a loopable ambience track and a painted cover.</li>
          <li className="doc-li"><strong>AI UGC video</strong> — text → image → video → storage: a hook script, a keyframe, an animated clip.</li>
          <li className="doc-li"><strong>Illustrated kids&apos; books</strong> — image + audio + storage: a page illustration and a narrated read-aloud.</li>
        </ul>
        <p className="doc-p">
          Three products, one engine, one set of guarantees. The only thing that differs is the steps in the
          JSON — and even those can be authored from a sentence.
        </p>
      </div>

      <Notes>
        <p>
          The async seam matters: video is a <code>submit → result</code> port, not a blocking call, so a
          long-running render resolves by webhook or polling via <code>AsyncJobCorrelator</code> without
          changing the workflow. Storage is the one port whose output (a URL) is meant to be referenced by
          later steps — e.g. a video step&apos;s <code>firstFrameUrl</code> pointing at a stored image.
        </p>
      </Notes>
    </ExportPage>
  )
}
