# magic-ai-pipeline-demo

The live, source-paired showcase for **magic-ai-pipeline** — a reusable, provider-agnostic
backbone for AI generation pipelines. Describe a pipeline in plain English and get a
**validated, executable, provider-agnostic workflow**.

> Live at **https://objectifthunes.github.io/magic-ai-pipeline-demo/** (once Pages is enabled).

## What it shows

- The **Workflow Studio** runs the *real* `@objectifthunes/ai-core` + `@objectifthunes/ai-workflow`
  packages **in your browser** — `validateWorkflow` and `runWorkflow` are genuinely executed,
  not mocked.
- **Validate / Run are always free.** Run executes against in-memory **fake adapters** (no API
  keys, no network, no cost — fake outputs use the `example.invalid` domain).
- **Bring your own key (optional).** Paste an Anthropic API key to run the *real*
  `compileWorkflow` against Claude (via `@objectifthunes/provider-anthropic`'s injectable client).
  The request goes straight from your browser to Anthropic and spends **your** tokens — never the
  project's. Off by default; the key is held in memory only.
- Per-package pages with real-usage **code snippets** for `ai-core`, `ai-workflow`, and the five
  provider adapters (`provider-anthropic / replicate / elevenlabs / r2 / kie`).

## The packages

| Package | Role |
| --- | --- |
| `@objectifthunes/ai-core` | capability ports (text/image/video/audio/storage) + registry + machinery |
| `@objectifthunes/ai-workflow` | declarative workflow schema, validation, executor, NL→workflow compiler |
| `@objectifthunes/provider-anthropic` | Claude `TextGenPort` (tool_use structured output) |
| `@objectifthunes/provider-replicate` | `ImageGenPort` (gpt-image-2) |
| `@objectifthunes/provider-elevenlabs` | `AudioGenPort` (sfx / music) |
| `@objectifthunes/provider-r2` | `StoragePort` (put / presign) |
| `@objectifthunes/provider-kie` | `VideoGenPort` (Seedance, async webhook) |

## Stack

Next.js 16 (App Router, `output: 'export'`), React 19, Tailwind v4, `shiki` for syntax
highlighting, `@objectifthunes/whiteboard` for the interactive chrome. Everything runs
client-side — no servers.

## Local dev

The `@objectifthunes/*` packages are private. Add a read-capable npm token to a local `.npmrc`
(already git-ignored):

```
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

```bash
NPM_TOKEN=<your read token> pnpm install
pnpm dev      # http://localhost:3000
```

## Build / static export

```bash
pnpm build    # output: 'export' → static site in ./out
```

## Deploy

`.github/workflows/pages.yml` builds and deploys `out/` to GitHub Pages on push to `main`.
Add an `NPM_TOKEN` repo secret (Settings → Secrets and variables → Actions) so CI can install the
private `@objectifthunes/*` packages, and enable Pages with the **GitHub Actions** source.
