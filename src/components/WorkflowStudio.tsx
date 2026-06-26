'use client'

/**
 * The Workflow Studio — the interactive centrepiece. Everything here runs in
 * the visitor's browser against the REAL @objectifthunes/ai-core +
 * @objectifthunes/ai-workflow engines:
 *
 *   • Validate → the real `validateWorkflow` against a fake-adapter registry
 *     snapshot. Deterministic, free, always live.
 *   • Run      → the real `runWorkflow` against FAKE adapters, so a run never
 *     calls a provider and never costs anything.
 *   • Compile  → optional, off by default. When the visitor pastes their OWN
 *     Anthropic key we build a real provider-anthropic port over the browser
 *     SDK and call the real `compileWorkflow`. It spends the visitor's tokens,
 *     never the project's.
 */
import { useMemo, useState } from 'react'
import { Sparkles, Play, ShieldCheck, KeyRound, Wand2, ChevronRight } from 'lucide-react'
import { Button, Alert, Chip, Surface } from '@objectifthunes/whiteboard'
import { validateWorkflow, runWorkflow, type WorkflowProblem, type StepResult } from '@objectifthunes/ai-workflow'
import { createFakeRegistry } from '@/lib/fakeRegistry'
import { SAMPLES, type Sample } from '@/lib/sampleWorkflows'

type TraceStatus = 'pending' | 'running' | 'done'
interface TraceRow {
  stepId: string
  capability: string
  provider?: string
  status: TraceStatus
  summary?: string
}

type ValidationState =
  | { kind: 'idle' }
  | { kind: 'ok' }
  | { kind: 'problems'; problems: WorkflowProblem[] }
  | { kind: 'parse'; message: string }

const pretty = (w: unknown) => JSON.stringify(w, null, 2)

function summarizeOutput(value: unknown): string {
  if (value && typeof value === 'object' && 'bytes' in (value as Record<string, unknown>)) {
    const v = value as { bytes?: Uint8Array; contentType?: string }
    const len = v.bytes instanceof Uint8Array ? v.bytes.length : 0
    return `${v.contentType ?? 'bytes'} · ${len} byte${len === 1 ? '' : 's'}`
  }
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function isUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\//.test(value)
}

export default function WorkflowStudio() {
  // The registry is built ONCE from fake adapters; Run always targets it.
  const registry = useMemo(() => createFakeRegistry(), [])
  const snapshot = useMemo(() => registry.snapshot(), [registry])

  const [sample, setSample] = useState<Sample>(SAMPLES[0])
  const [goal, setGoal] = useState(SAMPLES[0].goal)
  const [text, setText] = useState(pretty(SAMPLES[0].workflow))

  const [apiKey, setApiKey] = useState('')
  const [compiling, setCompiling] = useState(false)
  const [compileError, setCompileError] = useState<string | null>(null)

  const [validation, setValidation] = useState<ValidationState>({ kind: 'idle' })
  const [trace, setTrace] = useState<TraceRow[]>([])
  const [outputs, setOutputs] = useState<Record<string, unknown> | null>(null)
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)

  function selectSample(s: Sample) {
    setSample(s)
    setGoal(s.goal)
    setText(pretty(s.workflow))
    setValidation({ kind: 'idle' })
    setTrace([])
    setOutputs(null)
    setRunError(null)
    setCompileError(null)
  }

  function parseWorkflow(): { ok: true; wf: Record<string, unknown> } | { ok: false; message: string } {
    try {
      return { ok: true, wf: JSON.parse(text) }
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : 'Invalid JSON' }
    }
  }

  function onValidate() {
    setOutputs(null)
    setTrace([])
    const parsed = parseWorkflow()
    if (!parsed.ok) {
      setValidation({ kind: 'parse', message: parsed.message })
      return
    }
    const result = validateWorkflow(parsed.wf, snapshot)
    setValidation(result.ok ? { kind: 'ok' } : { kind: 'problems', problems: result.problems })
  }

  async function onRun() {
    setRunError(null)
    setOutputs(null)
    const parsed = parseWorkflow()
    if (!parsed.ok) {
      setValidation({ kind: 'parse', message: parsed.message })
      return
    }
    const wf = parsed.wf as { steps?: { id: string; capability: string }[]; inputs?: Record<string, unknown> }
    // Seed the trace from the declared steps so every row is visible up front.
    setTrace((wf.steps ?? []).map(s => ({ stepId: s.id, capability: s.capability, status: 'pending' as const })))
    // Build run inputs from the declared inputs, seeded from the sample.
    const inputs: Record<string, unknown> = {}
    for (const key of Object.keys(wf.inputs ?? {})) {
      inputs[key] = sample.inputs[key] ?? `demo ${key}`
    }
    setRunning(true)
    try {
      const res = await runWorkflow(parsed.wf as Parameters<typeof runWorkflow>[0], registry, inputs, {
        onStepStart: (id) =>
          setTrace(rows => rows.map(r => (r.stepId === id ? { ...r, status: 'running' } : r))),
        onStepDone: (r: StepResult) =>
          setTrace(rows =>
            rows.map(row =>
              row.stepId === r.stepId
                ? { ...row, status: 'done', provider: r.provider, summary: summarizeOutput(r.output) }
                : row,
            ),
          ),
      })
      setOutputs(res.outputs)
      setValidation({ kind: 'ok' })
    } catch (e) {
      setRunError(e instanceof Error ? e.message : 'Run failed')
    } finally {
      setRunning(false)
    }
  }

  async function onCompile() {
    if (!apiKey.trim()) {
      setCompileError('Paste your own Anthropic API key first — compilation uses your key and your tokens.')
      return
    }
    setCompiling(true)
    setCompileError(null)
    try {
      const [{ default: Anthropic }, { createAnthropicTextProvider }, { compileWorkflow }] = await Promise.all([
        import('@anthropic-ai/sdk'),
        import('@objectifthunes/provider-anthropic'),
        import('@objectifthunes/ai-workflow'),
      ])
      const client = new Anthropic({ apiKey: apiKey.trim(), dangerouslyAllowBrowser: true })
      // The Anthropic SDK's overloaded messages.create is stricter than the
      // adapter's structural AnthropicLike seam, so cast at the injection point.
      const port = createAnthropicTextProvider({ client: client as never })
      const wf = await compileWorkflow(goal, snapshot, port)
      setText(pretty(wf))
      setValidation({ kind: 'idle' })
      setTrace([])
      setOutputs(null)
    } catch (e) {
      setCompileError(
        e instanceof Error
          ? `Compilation failed: ${e.message}. (A browser request may be blocked by Anthropic CORS, or the key/credits may be invalid.)`
          : 'Compilation failed.',
      )
    } finally {
      setCompiling(false)
    }
  }

  // ── "Break it" mutations: prove the validator catches real mistakes ──
  function mutate(fn: (wf: Record<string, unknown>) => void) {
    const parsed = parseWorkflow()
    if (!parsed.ok) {
      setValidation({ kind: 'parse', message: parsed.message })
      return
    }
    fn(parsed.wf)
    const next = pretty(parsed.wf)
    setText(next)
    const result = validateWorkflow(parsed.wf, snapshot)
    setValidation(result.ok ? { kind: 'ok' } : { kind: 'problems', problems: result.problems })
    setOutputs(null)
    setTrace([])
  }

  const breakers: { label: string; run: () => void }[] = [
    {
      label: 'Unknown capability',
      run: () =>
        mutate(wf => {
          const steps = wf.steps as { capability: string }[]
          if (steps?.[0]) steps[0].capability = 'hologram'
        }),
    },
    {
      label: 'Break a step reference',
      run: () =>
        mutate(wf => {
          wf.output = Object.fromEntries(
            Object.entries((wf.output ?? {}) as Record<string, string>).map(([k, v]) => [
              k,
              v.replace(/steps\.(\w+)/, 'steps.ghostStep'),
            ]),
          )
        }),
    },
    {
      label: 'Duplicate a step id',
      run: () =>
        mutate(wf => {
          const steps = wf.steps as { id: string }[]
          if (steps?.length >= 2) steps[1].id = steps[0].id
        }),
    },
  ]

  return (
    <div className="studio" id="studio">
      <div className="studio__head">
        <div className="studio__head-titles">
          <span className="studio__eyebrow">
            <Sparkles size={12} strokeWidth={2} /> WORKFLOW STUDIO · LIVE
          </span>
          <h2 className="studio__title">Author, validate and run a pipeline — right here.</h2>
          <p className="studio__sub">
            Validate and Run execute the real <code>ai-core</code> + <code>ai-workflow</code> engines in your
            browser, against fake adapters. No key, no cost, always live.
          </p>
        </div>
        <div className="studio__samples" role="tablist" aria-label="Sample pipelines">
          {SAMPLES.map(s => (
            <button
              key={s.id}
              role="tab"
              aria-selected={s.id === sample.id}
              className={`studio__sample${s.id === sample.id ? ' is-active' : ''}`}
              onClick={() => selectSample(s)}
            >
              <span className="studio__sample-label">{s.label}</span>
              <span className="studio__sample-caps">
                {s.caps.map(c => (
                  <span key={c} className="studio__cap">{c}</span>
                ))}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="studio__grid">
        {/* ── Left: natural language + BYOK ── */}
        <div className="studio__col">
          <label className="studio__field-label" htmlFor="studio-goal">
            <Wand2 size={12} strokeWidth={2} /> PLAIN-ENGLISH GOAL
          </label>
          <textarea
            id="studio-goal"
            className="studio__textarea studio__textarea--goal"
            value={goal}
            onChange={e => setGoal(e.target.value)}
            spellCheck={false}
          />

          <div className="studio__byok">
            <div className="studio__byok-head">
              <KeyRound size={13} strokeWidth={2} />
              <span>Compile with Claude — optional, off by default</span>
            </div>
            <p className="studio__byok-note">
              Bring your <strong>own</strong> Anthropic key to author the workflow from the text above with the
              real <code>compileWorkflow</code> repair loop. The request goes straight from your browser to
              Anthropic and spends <strong>your</strong> tokens — never this project&apos;s. The key is held in
              memory only and never sent anywhere else.
            </p>
            <div className="studio__byok-row">
              <input
                aria-label="Anthropic API key"
                className="studio__key"
                type="password"
                placeholder="sk-ant-…  (your key, kept in memory)"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              <Button variant="secondary" onClick={onCompile} disabled={compiling}>
                {compiling ? 'Compiling…' : 'Compile with Claude'}
              </Button>
            </div>
            {compileError ? <Alert tone="error">{compileError}</Alert> : null}
          </div>
        </div>

        {/* ── Right: editable workflow JSON ── */}
        <div className="studio__col">
          <label className="studio__field-label" htmlFor="studio-json">
            <ChevronRight size={12} strokeWidth={2} /> WORKFLOW JSON · EDITABLE
          </label>
          <textarea
            id="studio-json"
            className="studio__textarea studio__textarea--json"
            value={text}
            onChange={e => setText(e.target.value)}
            spellCheck={false}
          />
          <div className="studio__actions">
            <Button variant="primary" onClick={onValidate}>
              <ShieldCheck size={14} strokeWidth={2} /> Validate
            </Button>
            <Button variant="secondary" onClick={onRun} disabled={running}>
              <Play size={14} strokeWidth={2} /> {running ? 'Running…' : 'Run on fakes'}
            </Button>
            <span className="studio__free">free · deterministic</span>
          </div>
          <div className="studio__breakers">
            <span className="studio__breakers-label">try breaking it:</span>
            {breakers.map(b => (
              <button key={b.label} className="studio__breaker" onClick={b.run}>
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Validation result ── */}
      {validation.kind !== 'idle' ? (
        <div className="studio__result">
          {validation.kind === 'ok' ? (
            <Alert tone="success">
              <strong>Valid.</strong> Every step capability is registered, every reference resolves, and the
              graph is acyclic. The engine would run this exactly as written.
            </Alert>
          ) : validation.kind === 'parse' ? (
            <Alert tone="error">
              <strong>Not JSON yet.</strong> {validation.message}
            </Alert>
          ) : (
            <div className="studio__problems">
              <Alert tone="error">
                <strong>{validation.problems.length} problem{validation.problems.length === 1 ? '' : 's'}.</strong>{' '}
                The validator refuses the workflow — typed, before a single token is spent.
              </Alert>
              <ul className="studio__problem-list">
                {validation.problems.map((p, i) => (
                  <li key={i} className="studio__problem">
                    <code className="studio__problem-code">{p.code}</code>
                    {p.stepId ? <Chip>{p.stepId}</Chip> : null}
                    <span>{p.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {/* ── Run trace + outputs ── */}
      {trace.length > 0 ? (
        <div className="studio__run">
          <span className="studio__field-label"><Play size={12} strokeWidth={2} /> EXECUTION TRACE</span>
          <div className="studio__trace">
            {trace.map(row => (
              <div key={row.stepId} className={`studio__step studio__step--${row.status}`}>
                <span className="studio__step-dot" aria-hidden />
                <span className="studio__step-id">{row.stepId}</span>
                <span className="studio__step-cap">{row.capability}</span>
                <span className="studio__step-provider">{row.provider ?? '—'}</span>
                <span className="studio__step-summary">{row.summary ?? (row.status === 'running' ? 'running…' : '')}</span>
              </div>
            ))}
          </div>
          {runError ? <Alert tone="error">{runError}</Alert> : null}
          {outputs ? (
            <Surface className="studio__outputs" padding="md">
              <span className="studio__field-label">OUTPUTS</span>
              <dl className="studio__output-list">
                {Object.entries(outputs).map(([k, v]) => (
                  <div key={k} className="studio__output-row">
                    <dt>{k}</dt>
                    <dd>
                      {isUrl(v) ? (
                        <a className="studio__output-link" href={v} onClick={e => e.preventDefault()} title="Fake URL — not followed">
                          {v}
                        </a>
                      ) : (
                        summarizeOutput(v)
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </Surface>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
