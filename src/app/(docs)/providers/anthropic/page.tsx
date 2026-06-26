import Link from 'next/link'
import { ExportPage } from '@/components/ExportPage'
import { Source } from '@/components/Source'
import { Notes } from '@/components/Notes'
import { findExport } from '@/components/exports'

const e = findExport('/providers/anthropic/')!

const SIG = `function createAnthropicTextProvider(config?: AnthropicConfig): TextGenPort

interface AnthropicConfig {
  apiKey?: string
  model?: string                 // default: claude-opus-4-8
  provider?: string
  client?: AnthropicLike         // the injectable seam — pass your own SDK client
  defaultMaxTokens?: number
}`

const SERVER = `import { createRegistry } from '@objectifthunes/ai-core'
import { createAnthropicTextProvider } from '@objectifthunes/provider-anthropic'

// Server-side: let the adapter build its own client from the env key.
const registry = createRegistry()
registry.register(
  createAnthropicTextProvider({ apiKey: process.env.ANTHROPIC_API_KEY }),
  { default: true },
)
//  capability: 'text'   env: ANTHROPIC_API_KEY`

const BYOK = `import Anthropic from '@anthropic-ai/sdk'
import { createAnthropicTextProvider } from '@objectifthunes/provider-anthropic'

// Browser BYOK: inject a client built from the visitor's own key.
const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
const textPort = createAnthropicTextProvider({ client })
// identical TextGenPort — drives compileWorkflow and any text step`

export default async function Page() {
  return (
    <ExportPage group={e.group} title="provider-anthropic" lede={e.lede}>
      <p className="doc-p">
        A <code>TextGenPort</code> over the Anthropic Messages API. Its one design decision matters everywhere
        else: the client is injectable. Pass an <code>apiKey</code> and it builds its own client; pass a{' '}
        <code>client</code> and it uses yours. That single seam is what lets the exact same code author a
        workflow on a server and live in a browser tab with the visitor&apos;s key.
      </p>

      <Source code={SIG} lang="ts" label="SIGNATURE · capability: text" />
      <Source code={SERVER} label="SERVER" />

      <div>
        <h2 className="doc-h2">The BYOK seam</h2>
        <p className="doc-p">
          The injectable <code>client</code> is why this is the only provider the{' '}
          <Link href="/studio/" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Studio</Link>{' '}
          runs for real. Anthropic&apos;s SDK runs in the browser with <code>dangerouslyAllowBrowser: true</code>;
          the adapter wraps it as a port; <code>compileWorkflow</code> never knows the difference.
        </p>
      </div>
      <Source code={BYOK} label="BROWSER · BYOK" />

      <Notes>
        <p>
          Default model is <code>claude-opus-4-8</code>; override with <code>model</code>. When a text step
          requests an <code>outputSchema</code>, the adapter forces a tool call and returns the structured{' '}
          <code>data</code> rather than free text — which is how <code>compileWorkflow</code> gets clean JSON.
        </p>
      </Notes>
    </ExportPage>
  )
}
