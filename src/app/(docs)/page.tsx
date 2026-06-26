import Link from 'next/link'
import { ArrowDownToLine, Code2, Sparkles, ShieldCheck, Workflow, Boxes } from 'lucide-react'
import { CodeBlock } from '@/components/CodeBlock'
import { Eyebrow } from '@/components/Eyebrow'
import { GROUPS, exportsByGroup } from '@/components/exports'
import { StudioMount } from '@/components/StudioMount'

const INSTALL = `# the contract + the engine, then any provider adapters you want
pnpm add @objectifthunes/ai-core @objectifthunes/ai-workflow
pnpm add @objectifthunes/provider-anthropic   # text — the BYOK seam
# server-side adapters, registered behind your own API:
pnpm add @objectifthunes/provider-replicate \\
         @objectifthunes/provider-elevenlabs \\
         @objectifthunes/provider-kie \\
         @objectifthunes/provider-r2`

const QUICKSTART = `import { createRegistry } from '@objectifthunes/ai-core'
import { compileWorkflow, validateWorkflow, runWorkflow } from '@objectifthunes/ai-workflow'
import { createAnthropicTextProvider } from '@objectifthunes/provider-anthropic'
import { createReplicateImageProvider } from '@objectifthunes/provider-replicate'
import { createElevenLabsAudioProvider } from '@objectifthunes/provider-elevenlabs'
import { createR2StorageProvider } from '@objectifthunes/provider-r2'

// 1 — register whatever providers you have. Several per capability is fine —
//     steps pick one by name; nothing in the pipeline hard-codes a vendor.
const registry = createRegistry()
registry.register(createAnthropicTextProvider({ apiKey: process.env.ANTHROPIC_API_KEY })) // text  → "anthropic"
registry.register(createReplicateImageProvider())                                          // image → "replicate"
registry.register(createElevenLabsAudioProvider())                                         // audio → "elevenlabs"
registry.register(createR2StorageProvider())                                               // storage → "r2"
// + createKieVideoProvider({ correlator, callbackUrl }) for video → "kie", same pattern.

// 2 — author from one English sentence (self-correcting repair loop).
//     Want OpenAI images instead of Replicate? Register it and pin the step — nothing else changes.
const snapshot = registry.snapshot()
const workflow = await compileWorkflow(
  'Write a one-line hook, render a key image, compose a short score, store everything and return the URLs',
  snapshot,
  registry.get('text'),
)

// 3 — the unbreakable gate, then run it
const check = validateWorkflow(workflow, snapshot)
if (!check.ok) throw new Error(check.problems.map(p => p.message).join('; '))
const { outputs } = await runWorkflow(workflow, registry, { topic: 'tidal energy' })`

const WHY = [
  { title: 'One contract, every modality', blurb: 'Five typed ports — text, image, audio, video, storage — so the same workflow drives Claude, Replicate, ElevenLabs, Kie and R2 without naming any of them.' },
  { title: 'Unbreakable by construction', blurb: 'A Zod schema, a registry-aware validator and a deterministic runner. A malformed pipeline is rejected with typed problems before a single token is spent.' },
  { title: 'Reusable across products', blurb: 'The exact same engine powers relaxing-music apps, AI UGC video, and illustrated kids’ books — swap the steps, keep the guarantees.' },
]

export default function HomePage() {
  return (
    <div className="landing">
      <section className="landing__hero">
        <Eyebrow icon={<Sparkles size={12} strokeWidth={1.75} />}>MAGIC AI PIPELINE · SDK</Eyebrow>
        <h1 className="landing__title">
          Describe an AI pipeline in plain English. Get a <em>validated</em>, provider-agnostic workflow.
        </h1>
        <p className="landing__lede">
          A small TypeScript stack: <code>ai-core</code> defines five typed capability ports and a registry;{' '}
          <code>ai-workflow</code> turns one English sentence into declarative JSON, validates it unbreakably, and
          runs it across whatever providers you registered. The Studio below runs the real engines in your
          browser — free, no key required.
        </p>
        <div className="landing__cta">
          <a href="#studio" className="landing__cta-btn landing__cta-btn--primary">
            <Sparkles size={14} strokeWidth={2} /> Open the Workflow Studio
          </a>
          <Link href="/getting-started/" className="landing__cta-btn">
            <Code2 size={14} strokeWidth={2} /> Getting started
          </Link>
        </div>
      </section>

      <section>
        <StudioMount />
      </section>

      <section>
        <div className="landing__grid">
          {GROUPS.map(g => {
            const items = exportsByGroup(g.id)
            if (items.length === 0) return null
            const first = items[0]
            return (
              <Link key={g.id} href={first.href} className="landing__card">
                <div className="landing__card-row">
                  <span className="landing__card-title">{g.label}</span>
                  <span className="landing__card-count">
                    {items.length} {items.length === 1 ? 'page' : 'pages'}
                  </span>
                </div>
                <p className="landing__card-blurb">{g.blurb}</p>
                <span className="landing__card-open">Open →</span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="landing__block">
        <Eyebrow icon={<ArrowDownToLine size={12} strokeWidth={1.75} />}>INSTALL</Eyebrow>
        <CodeBlock code={INSTALL} lang="bash" />
        <Eyebrow icon={<Code2 size={12} strokeWidth={1.75} />}>SIXTY-SECOND QUICKSTART</Eyebrow>
        <CodeBlock code={QUICKSTART} lang="ts" />
        <p style={{ color: 'var(--wb-text-secondary)', fontSize: 14, marginTop: '0.4rem' }}>
          The packages are published to npm under <code>@objectifthunes</code> with restricted access (org
          members only). See{' '}
          <Link href="/getting-started/" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
            Getting started
          </Link>{' '}
          for the full wire-up, or read the{' '}
          <Link href="/architecture/" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
            architecture
          </Link>
          .
        </p>
      </section>

      <section className="landing__block">
        <Eyebrow icon={<ShieldCheck size={12} strokeWidth={1.75} />}>WHY IT&apos;S DIFFERENT</Eyebrow>
        <div className="landing__why">
          {WHY.map(w => (
            <div key={w.title} className="landing__why-card">
              <span className="landing__why-title">{w.title}</span>
              <p className="landing__why-blurb">{w.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing__block">
        <div className="landing__grid">
          <Link href="/ai-core/overview/" className="landing__card">
            <div className="landing__card-row">
              <span className="landing__card-title"><Boxes size={15} strokeWidth={1.75} style={{ verticalAlign: '-2px', marginRight: 6 }} />Ports &amp; registry</span>
            </div>
            <p className="landing__card-blurb">The capability contract every provider implements and every workflow targets.</p>
            <span className="landing__card-open">ai-core →</span>
          </Link>
          <Link href="/ai-workflow/validate/" className="landing__card">
            <div className="landing__card-row">
              <span className="landing__card-title"><Workflow size={15} strokeWidth={1.75} style={{ verticalAlign: '-2px', marginRight: 6 }} />The unbreakable validator</span>
            </div>
            <p className="landing__card-blurb">Schema, references and cycles — every failure typed, every time. Break it live in the Studio.</p>
            <span className="landing__card-open">ai-workflow →</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
