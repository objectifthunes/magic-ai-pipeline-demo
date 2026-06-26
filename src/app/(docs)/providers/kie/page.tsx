import Link from 'next/link'
import { ExportPage } from '@/components/ExportPage'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { findExport } from '@/components/exports'

const e = findExport('/providers/kie/')!

const USE = `import { createRegistry } from '@objectifthunes/ai-core'
import { createKieVideoProvider } from '@objectifthunes/provider-kie'

const registry = createRegistry()
registry.register(
  createKieVideoProvider({ apiKey: process.env.KIE_API_KEY, webhookSecret: process.env.KIE_WEBHOOK_SECRET }),
  { default: true },
)
//  capability: 'video'   env: KIE_API_KEY`

const SHAPE = `// Video is async: submit returns a handle, result() resolves later.
const port: VideoGenPort = {
  capability: 'video',
  provider: 'kie',
  async submit(input, ctx) {
    const jobId = await kie.create(input.prompt, input.firstFrameUrl, input.resolution, ctx?.signal)
    return {
      id: jobId,
      result: () => correlator.await(jobId, { timeoutMs: 600_000, poll: () => kie.poll(jobId) }),
    }
  },
}`

export default async function Page() {
  return (
    <ExportPage group={e.group} title="provider-kie" lede={e.lede}>
      <p className="doc-p">
        A <code>VideoGenPort</code> over Kie.ai video models — the async one. <code>submit</code> kicks off a
        render and hands back a job handle; <code>result()</code> resolves when the webhook fires or polling
        completes, coordinated by ai-core&apos;s{' '}
        <Link href="/ai-core/machinery/" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>AsyncJobCorrelator</Link>.
        Server-side. Illustrative snippets only.
      </p>

      <Source code={USE} label="REGISTER · capability: video · env: KIE_API_KEY" />
      <Source code={SHAPE} lang="ts" label="THE ASYNC PORT IT IMPLEMENTS" />

      <Notes>
        <p>
          The runner awaits <code>result()</code> transparently, so a workflow author writes a video step
          exactly like any other — the minutes-long render is invisible at the JSON level. A common pattern is
          a storage step before the video step, so <code>firstFrameUrl</code> can reference the stored
          keyframe&apos;s URL.
        </p>
      </Notes>
    </ExportPage>
  )
}
