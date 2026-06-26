import { ExportPage } from '@/components/ExportPage'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { findExport } from '@/components/exports'

const e = findExport('/ai-core/machinery/')!

const CORRELATOR = `import { AsyncJobCorrelator } from '@objectifthunes/ai-core'

// One correlator per long-running modality (e.g. video). The webhook ingress
// resolves jobs by id; await() races that callback against an optional poll
// loop and a timeout, cleaning up its own timers when the race settles.
const correlator = new AsyncJobCorrelator<VideoGenOutput>()

// inside your VideoGenPort.submit():
const handle = {
  id: jobId,
  result: () => correlator.await(jobId, {
    timeoutMs: 10 * 60_000,
    pollIntervalMs: 5_000,
    poll: () => pollVendor(jobId),   // → { done, result?, failed?, error? }
    signal,
  }),
}

// inside your webhook route:
correlator.resolve(jobId, output)   // or correlator.reject(jobId, message)`

const ERR = `import { AiError } from '@objectifthunes/ai-core'

// Every failure in the stack is an AiError with a typed code, so callers can
// branch without string-matching messages.
type AiErrorCode =
  | 'rate_limited' | 'timeout' | 'invalid_input'
  | 'provider_error' | 'validation_failed' | 'aborted' | 'unknown'

throw new AiError('Anthropic returned no tool call', { code: 'provider_error', retryable: true })`

export default async function Page() {
  return (
    <ExportPage group={e.group} title="Machinery" lede={e.lede}>
      <p className="doc-p">
        Beyond the ports and registry, ai-core ships the operational glue every real adapter needs:
        webhook-or-poll correlation, retry with backoff, idempotency keys, cost tracking, and a single typed
        error. None of it is required to write an adapter, but all of it is there when you graduate from a fake
        to a vendor.
      </p>

      <div>
        <h2 className="doc-h2">AsyncJobCorrelator</h2>
        <p className="doc-p">
          The piece that makes the async video port practical. It lets a webhook and a polling loop race to
          deliver the same result, with an internal abort that tears down pending timers so the process exits
          cleanly.
        </p>
      </div>
      <Source code={CORRELATOR} label="WEBHOOK ⨯ POLL ⨯ TIMEOUT" />

      <div>
        <h2 className="doc-h2">AiError</h2>
        <p className="doc-p">
          One error type, a closed set of codes. The workflow runner wraps validation and resolution failures
          as <code>validation_failed</code>, and an aborted run as <code>aborted</code>.
        </p>
      </div>
      <Source code={ERR} lang="ts" label="TYPED FAILURES" />

      <Notes>
        <p>
          Also exported here: retry/backoff helpers, idempotency-key utilities, and a cost tracker. They&apos;re
          adapter-side concerns — the workflow layer stays pure and deterministic and leaves rate limits,
          retries and billing to the registered providers.
        </p>
      </Notes>
    </ExportPage>
  )
}
