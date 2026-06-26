/**
 * Thin browser client for the @objectifthunes/ai-authority service (the thin
 * NestJS app on Railway). This is the REAL BYOK path: the visitor's keys are
 * POSTed to the authority, which builds an ai-core registry from them, registers
 * the real provider-* adapters, and runs validateWorkflow + runWorkflow /
 * compileWorkflow server-side (where CORS, webhooks and credentials work).
 *
 * Keys travel only to the authority over HTTPS, are used for that one request,
 * and are never stored or logged (see the authority's SafeLogger + redaction
 * test). They never touch this static site's origin beyond the fetch body.
 */

/** Default to the deployed authority; overridable at build time. */
export const AUTHORITY_URL = (
  process.env.NEXT_PUBLIC_AUTHORITY_URL ?? 'https://web-production-c571.up.railway.app'
).replace(/\/$/, '')

export interface R2Keys {
  accountId: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  publicUrl: string
}

export interface Keys {
  anthropic?: string
  replicate?: string
  elevenlabs?: string
  kie?: string
  r2?: R2Keys
}

export interface AuthorityProblem {
  code: string
  message: string
  stepId?: string
}

export interface AuthorityStep {
  stepId: string
  provider: string
  output: unknown
  usage?: unknown
  cost?: unknown
}

export type RunResponse =
  | { ok: true; outputs: Record<string, unknown>; steps: Record<string, AuthorityStep> }
  | { ok: false; problems?: AuthorityProblem[]; error?: string; code?: string; stepId?: string }

export type CompileResponse =
  | { ok: true; workflow: unknown }
  | { ok: false; error: string }

/** Strip empty key fields so a blank input never registers a broken adapter. */
function prune(keys: Keys): Keys {
  const out: Keys = {}
  if (keys.anthropic?.trim()) out.anthropic = keys.anthropic.trim()
  if (keys.replicate?.trim()) out.replicate = keys.replicate.trim()
  if (keys.elevenlabs?.trim()) out.elevenlabs = keys.elevenlabs.trim()
  if (keys.kie?.trim()) out.kie = keys.kie.trim()
  if (keys.r2) {
    const r = keys.r2
    if (r.accountId.trim() && r.bucket.trim() && r.accessKeyId.trim() && r.secretAccessKey.trim() && r.publicUrl.trim()) {
      out.r2 = {
        accountId: r.accountId.trim(),
        bucket: r.bucket.trim(),
        accessKeyId: r.accessKeyId.trim(),
        secretAccessKey: r.secretAccessKey.trim(),
        publicUrl: r.publicUrl.trim(),
      }
    }
  }
  return out
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${AUTHORITY_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (e) {
    throw new Error(
      `Could not reach the authority at ${AUTHORITY_URL}. It may be asleep or unreachable. (${e instanceof Error ? e.message : 'network error'})`,
    )
  }
  // The authority returns JSON on every status (200/400/422/502); parse regardless.
  const text = await res.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(`Authority returned a non-JSON ${res.status} response: ${text.slice(0, 200)}`)
  }
}

export function runLive(workflow: unknown, inputs: Record<string, unknown>, keys: Keys): Promise<RunResponse> {
  return post<RunResponse>('/run', { workflow, inputs, keys: prune(keys) })
}

export function compileLive(goal: string, keys: Keys): Promise<CompileResponse> {
  return post<CompileResponse>('/compile', { goal, keys: prune(keys) })
}
