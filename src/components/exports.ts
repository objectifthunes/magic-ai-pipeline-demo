export type Badge = 'GUIDE' | 'LIVE' | 'PURE' | 'BYOK' | 'SERVER' | 'TYPE' | 'UTIL'

export interface ExportEntry {
  slug: string
  name: string
  group: GroupId
  href: string
  badge?: Badge
  /** A short blurb shown next to the title on the export page. */
  lede: string
}

export type GroupId = 'guides' | 'ai-core' | 'ai-workflow' | 'providers'

export const GROUPS: { id: GroupId; label: string; blurb: string }[] = [
  { id: 'guides',      label: 'Guides',       blurb: 'Install the stack, run a pipeline in the live Studio, and see the ports-and-adapters architecture that makes it provider-agnostic.' },
  { id: 'ai-core',     label: 'ai-core',      blurb: 'The capability contract: five typed ports (text, image, audio, video, storage), a registry that resolves capability → provider, and the async machinery. Pure TS + Zod — runs in the browser and in Node.' },
  { id: 'ai-workflow', label: 'ai-workflow',  blurb: 'A workflow is JSON. Validate it (unbreakably), run it across the registry, or compile it from one English sentence with Claude. Pure TS + Zod.' },
  { id: 'providers',   label: 'Providers',    blurb: 'Thin adapters that implement an ai-core port for one vendor. Register the ones you want; the workflow never names a vendor. Server-side except provider-anthropic (BYOK).' },
]

export const EXPORTS: ExportEntry[] = [
  // ── Guides ───────────────────────────────────────────
  { slug: 'getting-started', name: 'Getting started', group: 'guides', href: '/getting-started/', badge: 'GUIDE', lede: 'Install ai-core + ai-workflow, register a provider, and compile-validate-run your first pipeline in about a minute.' },
  { slug: 'studio',          name: 'Workflow Studio', group: 'guides', href: '/studio/',          badge: 'LIVE',  lede: 'The interactive centrepiece: author in English, validate against the unbreakable schema, and run a pipeline on fake adapters — live, in your browser, for free.' },
  { slug: 'architecture',    name: 'Architecture',    group: 'guides', href: '/architecture/',    badge: 'GUIDE', lede: 'Ports and adapters, and the three-layer guarantee: a typed schema, a registry-aware validator, and a deterministic runner.' },

  // ── ai-core ──────────────────────────────────────────
  { slug: 'overview', name: 'Overview',    group: 'ai-core', href: '/ai-core/overview/', badge: 'PURE', lede: 'createRegistry, the five capabilities and the CallResult shape — the contract every provider implements and every workflow targets.' },
  { slug: 'ports',    name: 'Ports',       group: 'ai-core', href: '/ai-core/ports/',    badge: 'TYPE', lede: 'TextGenPort, ImageGenPort, AudioGenPort, VideoGenPort, StoragePort — the five Zod-typed interfaces, including the async video submit/result seam.' },
  { slug: 'registry', name: 'Registry',    group: 'ai-core', href: '/ai-core/registry/', badge: 'PURE', lede: 'register, get, has and snapshot. The snapshot is the single source of truth the workflow validator and the authoring prompt both read.' },
  { slug: 'machinery', name: 'Machinery',  group: 'ai-core', href: '/ai-core/machinery/', badge: 'UTIL', lede: 'AsyncJobCorrelator for webhook-or-poll video jobs, retry/backoff, idempotency keys, cost tracking and AiError — the operational glue.' },

  // ── ai-workflow ──────────────────────────────────────
  { slug: 'overview', name: 'Overview',        group: 'ai-workflow', href: '/ai-workflow/overview/', badge: 'PURE', lede: 'A workflow is declarative JSON: inputs, steps and outputs, with {{ inputs.x }} / {{ steps.id.output.y }} references resolved at run time.' },
  { slug: 'validate', name: 'validateWorkflow', group: 'ai-workflow', href: '/ai-workflow/validate/', badge: 'PURE', lede: 'The unbreakable gate: schema + duplicate ids + unknown capabilities/providers + dangling references + cycles, every problem typed. Try it in the Studio.' },
  { slug: 'run',      name: 'runWorkflow',     group: 'ai-workflow', href: '/ai-workflow/run/',      badge: 'PURE', lede: 'Topo-sort, resolve references, call each port through the registry, stream onStepStart / onStepDone, return outputs + per-step results.' },
  { slug: 'compile',  name: 'compileWorkflow', group: 'ai-workflow', href: '/ai-workflow/compile/',  badge: 'BYOK', lede: 'One English sentence → a valid Workflow, via a TextGenPort and a self-correcting repair loop that re-validates until it parses. Live in the Studio with your key.' },

  // ── Providers ────────────────────────────────────────
  { slug: 'anthropic',  name: 'provider-anthropic',  group: 'providers', href: '/providers/anthropic/',  badge: 'BYOK',   lede: 'A TextGenPort over the Anthropic Messages API, with an injectable client — the seam that makes browser BYOK and server use the same code.' },
  { slug: 'replicate',  name: 'provider-replicate',  group: 'providers', href: '/providers/replicate/',  badge: 'SERVER', lede: 'An ImageGenPort (and more) over Replicate models. Needs REPLICATE_API_TOKEN. Server-side.' },
  { slug: 'elevenlabs', name: 'provider-elevenlabs', group: 'providers', href: '/providers/elevenlabs/', badge: 'SERVER', lede: 'An AudioGenPort over ElevenLabs for speech, music and sound effects. Needs ELEVENLABS_API_KEY. Server-side.' },
  { slug: 'kie',        name: 'provider-kie',        group: 'providers', href: '/providers/kie/',        badge: 'SERVER', lede: 'A VideoGenPort over Kie.ai video models — the async submit/result port, resolved by webhook or polling. Needs KIE_API_KEY. Server-side.' },
  { slug: 'r2',         name: 'provider-r2',         group: 'providers', href: '/providers/r2/',         badge: 'SERVER', lede: 'A StoragePort over Cloudflare R2: direct PUT and presigned GET. Needs the R2 account + bucket credentials. Server-side.' },
]

const GROUP_INDEX: Record<GroupId, { id: GroupId; label: string; blurb: string }> = Object.fromEntries(
  GROUPS.map(g => [g.id, g]),
) as Record<GroupId, { id: GroupId; label: string; blurb: string }>

export function groupOf(id: GroupId) {
  return GROUP_INDEX[id]
}

export function exportsByGroup(id: GroupId): ExportEntry[] {
  return EXPORTS.filter(e => e.group === id)
}

export function findExport(href: string): ExportEntry | undefined {
  const norm = href.endsWith('/') ? href : `${href}/`
  return EXPORTS.find(e => e.href === norm)
}

export const TOTAL_EXPORTS = EXPORTS.length
