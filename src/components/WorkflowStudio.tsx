'use client'

/**
 * The Workflow Studio — the interactive centrepiece.
 *
 *   • Validate  → the real `validateWorkflow` against a fake-adapter registry
 *     snapshot. Deterministic, free, always live, no key.
 *   • Simulate  → the real `runWorkflow` against FAKE adapters in your browser,
 *     so it never calls a provider and never costs anything.
 *   • Compile / Run live → bring your own keys. They are POSTed to the deployed
 *     @objectifthunes/ai-authority (thin NestJS on Railway), which builds an
 *     ai-core registry from your keys, registers the REAL provider-* adapters,
 *     and runs compileWorkflow / runWorkflow server-side. Your keys go only to
 *     the authority, for that one request, and are never stored or logged.
 */
import { useMemo, useState } from 'react'
import { Sparkles, Play, ShieldCheck, KeyRound, Wand2, ChevronRight, Rocket } from 'lucide-react'
import { Button, Alert, Chip, Surface } from '@objectifthunes/whiteboard'
import { validateWorkflow, runWorkflow, type StepResult } from '@objectifthunes/ai-workflow'
import { createFakeRegistry } from '@/lib/fakeRegistry'
import { SAMPLES, type Sample } from '@/lib/sampleWorkflows'
import { runLive, compileLive, type Keys, AUTHORITY_URL } from '@/lib/authorityClient'

type TraceStatus = 'pending' | 'running' | 'done'
interface TraceRow {
  stepId: string
  capability: string
  provider?: string
  status: TraceStatus
  summary?: string
}

interface DisplayProblem {
  code: string
  message: string
  stepId?: string
}

type ValidationState =
  | { kind: 'idle' }
  | { kind: 'ok' }
  | { kind: 'problems'; problems: DisplayProblem[] }
  | { kind: 'parse'; message: string }

const EMPTY_KEYS: Keys = {
  anthropic: '',
  replicate: '',
  elevenlabs: '',
  kie: '',
  r2: { accountId: '', bucket: '', accessKeyId: '', secretAccessKey: '', publicUrl: '' },
}

const pretty = (w: unknown) => JSON.stringify(w, null, 2)

function summarizeOutput(value: unknown): string {
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>
    if (typeof v.url === 'string') return v.url
    if (typeof v.text === 'string') return v.text
    if ('bytes' in v) {
      const ct = typeof v.contentType === 'string' ? v.contentType : 'binary'
      const b = v.bytes
      const len =
        b instanceof Uint8Array ? b.length : Array.isArray(b) ? b.length : b && typeof b === 'object' ? Object.keys(b).length : 0
      return `${ct} · ${len} byte${len === 1 ? '' : 's'}`
    }
  }
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function isUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\//.test(value)
}

export default function WorkflowStudio() {
  // The registry is built ONCE from fake adapters; Validate + Simulate target it.
  const registry = useMemo(() => createFakeRegistry(), [])
  const snapshot = useMemo(() => registry.snapshot(), [registry])

  const [sample, setSample] = useState<Sample>(SAMPLES[0])
  const [goal, setGoal] = useState(SAMPLES[0].goal)
  const [text, setText] = useState(pretty(SAMPLES[0].workflow))

  const [keys, setKeys] = useState<Keys>(EMPTY_KEYS)
  const [compiling, setCompiling] = useState(false)
  const [compileError, setCompileError] = useState<string | null>(null)

  const [validation, setValidation] = useState<ValidationState>({ kind: 'idle' })
  const [trace, setTrace] = useState<TraceRow[]>([])
  const [outputs, setOutputs] = useState<Record<string, unknown> | null>(null)
  const [outputsLive, setOutputsLive] = useState(false)
  const [running, setRunning] = useState(false)
  const [liveRunning, setLiveRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)

  function setKey(field: Exclude<keyof Keys, 'r2'>, value: string) {
    setKeys(k => ({ ...k, [field]: value }))
  }
  function setR2(field: keyof NonNullable<Keys['r2']>, value: string) {
    setKeys(k => ({ ...k, r2: { ...k.r2!, [field]: value } }))
  }

  function selectSample(s: Sample) {
    setSample(s)
    setGoal(s.goal)
    setText(pretty(s.workflow))
    setValidation({ kind: 'idle' })
    setTrace([])
    setOutputs(null)
    setOutputsLive(false)
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

  function buildInputs(wf: { inputs?: Record<string, unknown> }): Record<string, unknown> {
    const inputs: Record<string, unknown> = {}
    for (const key of Object.keys(wf.inputs ?? {})) inputs[key] = sample.inputs[key] ?? `demo ${key}`
    return inputs
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

  // Free, in-browser run against fake adapters.
  async function onSimulate() {
    setRunError(null)
    setOutputs(null)
    setOutputsLive(false)
    const parsed = parseWorkflow()
    if (!parsed.ok) {
      setValidation({ kind: 'parse', message: parsed.message })
      return
    }
    const wf = parsed.wf as { steps?: { id: string; capability: string; provider?: string }[]; inputs?: Record<string, unknown> }
    setTrace((wf.steps ?? []).map(s => ({ stepId: s.id, capability: s.capability, provider: s.provider, status: 'pending' as const })))
    setRunning(true)
    try {
      const res = await runWorkflow(parsed.wf as Parameters<typeof runWorkflow>[0], registry, buildInputs(wf), {
        onStepStart: id => setTrace(rows => rows.map(r => (r.stepId === id ? { ...r, status: 'running' } : r))),
        onStepDone: (r: StepResult) =>
          setTrace(rows =>
            rows.map(row =>
              row.stepId === r.stepId ? { ...row, status: 'done', provider: r.provider, summary: summarizeOutput(r.output) } : row,
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

  // Real run: POST the workflow + your keys to the authority.
  async function onRunLive() {
    setRunError(null)
    setOutputs(null)
    setOutputsLive(false)
    const parsed = parseWorkflow()
    if (!parsed.ok) {
      setValidation({ kind: 'parse', message: parsed.message })
      return
    }
    const wf = parsed.wf as { steps?: { id: string; capability: string; provider?: string }[]; inputs?: Record<string, unknown> }
    setTrace((wf.steps ?? []).map(s => ({ stepId: s.id, capability: s.capability, provider: s.provider, status: 'running' as const })))
    setLiveRunning(true)
    try {
      const res = await runLive(parsed.wf, buildInputs(wf), keys)
      if (res.ok) {
        setTrace(rows =>
          rows.map(r => {
            const st = res.steps[r.stepId]
            return st ? { ...r, status: 'done', provider: st.provider, summary: summarizeOutput(st.output) } : { ...r, status: 'done' }
          }),
        )
        setOutputs(res.outputs)
        setOutputsLive(true)
        setValidation({ kind: 'ok' })
      } else if (res.problems?.length) {
        setValidation({ kind: 'problems', problems: res.problems })
        setTrace([])
      } else {
        setRunError(res.error ?? 'The authority could not run this workflow.')
        setTrace(rows => rows.map(r => ({ ...r, status: 'pending' as const })))
      }
    } catch (e) {
      setRunError(e instanceof Error ? e.message : 'Run failed')
      setTrace(rows => rows.map(r => ({ ...r, status: 'pending' as const })))
    } finally {
      setLiveRunning(false)
    }
  }

  // Author from English via the authority's /compile (uses your Anthropic key).
  async function onCompile() {
    if (!keys.anthropic?.trim()) {
      setCompileError('Paste your Anthropic key in the panel below — the authority compiles with your key and your tokens.')
      return
    }
    setCompiling(true)
    setCompileError(null)
    try {
      const res = await compileLive(goal, keys)
      if (res.ok) {
        setText(pretty(res.workflow))
        setValidation({ kind: 'idle' })
        setTrace([])
        setOutputs(null)
        setOutputsLive(false)
      } else {
        setCompileError(res.error || 'Compilation failed.')
      }
    } catch (e) {
      setCompileError(e instanceof Error ? e.message : 'Compilation failed.')
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
    setText(pretty(parsed.wf))
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
            Object.entries((wf.output ?? {}) as Record<string, string>).map(([k, v]) => [k, v.replace(/steps\.(\w+)/, 'steps.ghostStep')]),
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

  const KEY_FIELDS: { field: Exclude<keyof Keys, 'r2'>; label: string; placeholder: string }[] = [
    { field: 'anthropic', label: 'anthropic', placeholder: 'sk-ant-… (text)' },
    { field: 'replicate', label: 'replicate', placeholder: 'r8_… (image)' },
    { field: 'elevenlabs', label: 'elevenlabs', placeholder: 'xi-… (audio)' },
    { field: 'kie', label: 'kie', placeholder: 'kie key (video)' },
  ]

  return (
    <div className="studio" id="studio">
      <div className="studio__head">
        <div className="studio__head-titles">
          <span className="studio__eyebrow">
            <Sparkles size={12} strokeWidth={2} /> WORKFLOW STUDIO · LIVE
          </span>
          <h2 className="studio__title">Author, validate and run a real multi-provider pipeline.</h2>
          <p className="studio__sub">
            Three samples spanning all five capabilities and five providers — Claude, Replicate, ElevenLabs,
            KIE, R2. <strong>Validate</strong> and <strong>Simulate</strong> run the real <code>ai-core</code> +{' '}
            <code>ai-workflow</code> engines in your browser on fake adapters: no key, no cost. <strong>Run live
            with your own keys</strong> and the deployed authority runs the real adapters end-to-end.
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
              <span className="studio__sample-provs">
                {s.providers.map(p => (
                  <span key={p} className="studio__prov">{p}</span>
                ))}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="studio__grid">
        {/* ── Left: natural language + compile ── */}
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
          <div className="studio__actions">
            <Button variant="secondary" onClick={onCompile} disabled={compiling}>
              <Wand2 size={14} strokeWidth={2} /> {compiling ? 'Compiling…' : 'Compile with the authority'}
            </Button>
            <span className="studio__free">uses your Anthropic key · real compileWorkflow</span>
          </div>
          {compileError ? <Alert tone="error">{compileError}</Alert> : null}
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
            <Button variant="secondary" onClick={onSimulate} disabled={running}>
              <Play size={14} strokeWidth={2} /> {running ? 'Simulating…' : 'Simulate on fakes'}
            </Button>
            <span className="studio__free">free · deterministic · no key</span>
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

      {/* ── BYOK key panel → real run via the authority ── */}
      <div className="studio__byok">
        <div className="studio__byok-head">
          <KeyRound size={13} strokeWidth={2} />
          <span>Run live with your own keys</span>
        </div>
        <p className="studio__byok-note">
          Fill the keys for the providers this pipeline uses, then <strong>Run live</strong>. Your keys are POSTed
          only to the authority over HTTPS, used for this one run, and <strong>never stored or logged</strong>. Live
          runs spend <strong>your</strong> provider credits. Leave a key blank and any step pinned to it is rejected
          with a typed problem — nothing silently breaks. Endpoint: <code>{AUTHORITY_URL}</code>.
        </p>
        <div className="studio__keys">
          {KEY_FIELDS.map(k => (
            <label key={k.field} className="studio__keyfield">
              <span className="studio__keyfield-label">{k.label}</span>
              <input
                className="studio__key"
                type="password"
                placeholder={k.placeholder}
                value={keys[k.field] ?? ''}
                onChange={e => setKey(k.field, e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </label>
          ))}
        </div>
        <div className="studio__r2">
          <span className="studio__r2-label">r2 (storage)</span>
          <div className="studio__r2-grid">
            <input className="studio__key" placeholder="account id" value={keys.r2!.accountId} onChange={e => setR2('accountId', e.target.value)} autoComplete="off" spellCheck={false} />
            <input className="studio__key" placeholder="bucket" value={keys.r2!.bucket} onChange={e => setR2('bucket', e.target.value)} autoComplete="off" spellCheck={false} />
            <input className="studio__key" type="password" placeholder="access key id" value={keys.r2!.accessKeyId} onChange={e => setR2('accessKeyId', e.target.value)} autoComplete="off" spellCheck={false} />
            <input className="studio__key" type="password" placeholder="secret access key" value={keys.r2!.secretAccessKey} onChange={e => setR2('secretAccessKey', e.target.value)} autoComplete="off" spellCheck={false} />
            <input className="studio__key studio__key--wide" placeholder="public base url (https://cdn…)" value={keys.r2!.publicUrl} onChange={e => setR2('publicUrl', e.target.value)} autoComplete="off" spellCheck={false} />
          </div>
        </div>
        <div className="studio__actions">
          <Button variant="primary" onClick={onRunLive} disabled={liveRunning}>
            <Rocket size={14} strokeWidth={2} /> {liveRunning ? 'Running live…' : 'Run live with my keys'}
          </Button>
          <span className="studio__free studio__free--warn">spends your provider credits</span>
        </div>
      </div>

      {/* ── Validation result ── */}
      {validation.kind !== 'idle' ? (
        <div className="studio__result">
          {validation.kind === 'ok' ? (
            <Alert tone="success">
              <strong>Valid.</strong> Every step capability is registered, every reference resolves, and the graph is
              acyclic. The engine would run this exactly as written.
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
          <span className="studio__field-label">
            <Play size={12} strokeWidth={2} /> EXECUTION TRACE {outputsLive ? '· LIVE' : '· SIMULATED'}
          </span>
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
              <span className="studio__field-label">OUTPUTS {outputsLive ? '· real URLs' : '· fake URLs'}</span>
              <dl className="studio__output-list">
                {Object.entries(outputs).map(([k, v]) => (
                  <div key={k} className="studio__output-row">
                    <dt>{k}</dt>
                    <dd>
                      {isUrl(v) ? (
                        outputsLive ? (
                          <a className="studio__output-link" href={v} target="_blank" rel="noreferrer">
                            {v}
                          </a>
                        ) : (
                          <a className="studio__output-link" href={v} onClick={e => e.preventDefault()} title="Fake URL — not followed">
                            {v}
                          </a>
                        )
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
