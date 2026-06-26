/**
 * Pre-authored sample workflows — the "canned authoring" path. Each is a real
 * `Workflow` object that passes `validateWorkflow` against the fake registry,
 * so it can be validated and run instantly with zero API calls. They double as
 * the seed for the optional "Compile with Claude" (BYOK) path: the natural
 * language `goal` is what gets sent to `compileWorkflow`.
 *
 * Every step pins an explicit `provider` — that's the point of the demo. The
 * SAME `capability` ("image") runs through DIFFERENT providers ("replicate"
 * vs "openai") in the same pipeline; swap a provider name and nothing else
 * changes. Across the four samples, all five capabilities (text/image/audio/
 * video/storage) and all six providers (anthropic, openai, replicate,
 * elevenlabs, kie, r2) are exercised.
 *
 * Reference syntax (from ai-workflow's template engine):
 *   {{ inputs.<name> }}              — a declared workflow input
 *   {{ steps.<id>.output.<path> }}   — a previous step's output field
 */
import type { Workflow } from '@objectifthunes/ai-workflow'

export interface Sample {
  id: string
  label: string
  blurb: string
  /** Capabilities this pipeline exercises, for the chip row. */
  caps: string[]
  /** Distinct providers this pipeline routes to, for the chip row. */
  providers: string[]
  /** Natural-language goal — sent verbatim to compileWorkflow when a key is present. */
  goal: string
  /** Default run inputs (keys must match workflow.inputs). */
  inputs: Record<string, unknown>
  workflow: Workflow
}

export const SAMPLES: Sample[] = [
  {
    id: 'explainer-reel',
    label: 'Animated explainer reel',
    blurb: 'Full-stack pipeline: script → keyart → score → animated clip → CDN. Five capabilities, five providers, one workflow.',
    caps: ['text', 'image', 'audio', 'video', 'storage'],
    providers: ['anthropic', 'replicate', 'elevenlabs', 'kie', 'r2'],
    goal: 'Build a 6-second animated explainer reel for a topic: write a one-line voiceover script (Claude), generate a keyframe illustration (Replicate), compose a short instrumental score (ElevenLabs), animate the keyframe into a 16:9 1080p clip (KIE), and store every asset to R2. Return the script and all URLs.',
    inputs: { topic: 'how tidal energy turns the moon into a battery' },
    workflow: {
      description: 'Animated explainer reel — text→image→audio→video→storage across 5 providers',
      inputs: { topic: { type: 'string', required: true, description: 'What the reel explains' } },
      steps: [
        {
          id: 'script',
          capability: 'text',
          provider: 'anthropic',
          params: {
            messages: [
              { role: 'system', content: 'You write tight one-line voiceover hooks for explainer videos.' },
              { role: 'user', content: 'One punchy line to open a reel about: {{ inputs.topic }}' },
            ],
          },
        },
        {
          id: 'keyart',
          capability: 'image',
          provider: 'replicate',
          params: { prompt: 'Bold flat-vector explainer keyframe, single strong focal idea: {{ inputs.topic }}', aspectRatio: '16:9', quality: 'high' },
        },
        {
          id: 'storeKeyart',
          capability: 'storage',
          provider: 'r2',
          params: { key: 'explainer/keyart.png', bytes: '{{ steps.keyart.output.bytes }}', contentType: '{{ steps.keyart.output.contentType }}' },
        },
        {
          id: 'score',
          capability: 'audio',
          provider: 'elevenlabs',
          params: { kind: 'music', prompt: 'upbeat curious instrumental bed under an explainer about {{ inputs.topic }}', durationSec: 6, instrumental: true },
        },
        {
          id: 'storeScore',
          capability: 'storage',
          provider: 'r2',
          params: { key: 'explainer/score.mp3', bytes: '{{ steps.score.output.bytes }}', contentType: '{{ steps.score.output.contentType }}' },
        },
        {
          id: 'clip',
          capability: 'video',
          provider: 'kie',
          params: {
            prompt: 'Animate the keyframe with subtle motion: {{ steps.script.output.text }}',
            firstFrameUrl: '{{ steps.storeKeyart.output.url }}',
            durationSec: 6,
            resolution: '1080p',
            aspectRatio: '16:9',
            generateAudio: false,
          },
        },
      ],
      output: {
        script: '{{ steps.script.output.text }}',
        keyartUrl: '{{ steps.storeKeyart.output.url }}',
        scoreUrl: '{{ steps.storeScore.output.url }}',
        videoUrl: '{{ steps.clip.output.url }}',
      },
    },
  },
  {
    id: 'two-engines',
    label: 'One brief, two image engines',
    blurb: 'The agnosticism proof: the SAME image step runs on Replicate AND OpenAI in one pipeline. Swap a provider name — nothing else moves.',
    caps: ['text', 'image', 'storage'],
    providers: ['openai', 'replicate', 'r2'],
    goal: 'From one creative brief, produce two hero images of the same subject — one via Replicate, one via OpenAI — so they can be compared side by side, and store both to R2. Use OpenAI to expand the brief into a vivid prompt first.',
    inputs: { brief: 'a lighthouse made of stacked vinyl records at golden hour' },
    workflow: {
      description: 'Same image capability, two providers (Replicate + OpenAI), one workflow',
      inputs: { brief: { type: 'string', required: true, description: 'The creative brief' } },
      steps: [
        {
          id: 'prompt',
          capability: 'text',
          provider: 'openai',
          params: {
            messages: [
              { role: 'system', content: 'Expand a brief into one vivid image prompt. No preamble.' },
              { role: 'user', content: '{{ inputs.brief }}' },
            ],
          },
        },
        {
          id: 'heroReplicate',
          capability: 'image',
          provider: 'replicate',
          params: { prompt: '{{ steps.prompt.output.text }}', aspectRatio: '3:2', quality: 'high' },
        },
        {
          id: 'heroOpenai',
          capability: 'image',
          provider: 'openai',
          params: { prompt: '{{ steps.prompt.output.text }}', aspectRatio: '3:2', quality: 'high' },
        },
        {
          id: 'storeReplicate',
          capability: 'storage',
          provider: 'r2',
          params: { key: 'ab/hero-replicate.png', bytes: '{{ steps.heroReplicate.output.bytes }}', contentType: '{{ steps.heroReplicate.output.contentType }}' },
        },
        {
          id: 'storeOpenai',
          capability: 'storage',
          provider: 'r2',
          params: { key: 'ab/hero-openai.png', bytes: '{{ steps.heroOpenai.output.bytes }}', contentType: '{{ steps.heroOpenai.output.contentType }}' },
        },
      ],
      output: {
        prompt: '{{ steps.prompt.output.text }}',
        replicateUrl: '{{ steps.storeReplicate.output.url }}',
        openaiUrl: '{{ steps.storeOpenai.output.url }}',
      },
    },
  },
  {
    id: 'sound-pack',
    label: 'Game sound pack',
    blurb: 'Audio-led: a looping ambience bed and a theme, plus cover art — three storage writes. ElevenLabs + Replicate + Anthropic + R2.',
    caps: ['text', 'audio', 'image', 'storage'],
    providers: ['anthropic', 'elevenlabs', 'replicate', 'r2'],
    goal: 'Produce a small game sound pack for a setting: write a one-line mood note (Claude), generate a seamless looping ambience SFX bed and a short theme track (ElevenLabs), generate matching cover art (Replicate), and store all three audio/image assets to R2.',
    inputs: { setting: 'a neon rain-soaked night market on a space station' },
    workflow: {
      description: 'Game sound pack — audio (sfx + music) + image + storage',
      inputs: { setting: { type: 'string', required: true, description: 'The world / setting' } },
      steps: [
        {
          id: 'mood',
          capability: 'text',
          provider: 'anthropic',
          params: {
            messages: [
              { role: 'system', content: 'Reply with one evocative mood line for a sound designer.' },
              { role: 'user', content: 'Setting: {{ inputs.setting }}' },
            ],
          },
        },
        {
          id: 'ambience',
          capability: 'audio',
          provider: 'elevenlabs',
          params: { kind: 'sfx', prompt: 'seamless looping ambience: {{ inputs.setting }}', durationSec: 30, loop: true },
        },
        {
          id: 'theme',
          capability: 'audio',
          provider: 'elevenlabs',
          params: { kind: 'music', prompt: 'short evocative theme: {{ steps.mood.output.text }}', durationSec: 20, instrumental: true },
        },
        {
          id: 'cover',
          capability: 'image',
          provider: 'replicate',
          params: { prompt: 'Album-style cover art, moody, no text: {{ inputs.setting }}', aspectRatio: '1:1', quality: 'high' },
        },
        {
          id: 'storeAmbience',
          capability: 'storage',
          provider: 'r2',
          params: { key: 'pack/ambience.mp3', bytes: '{{ steps.ambience.output.bytes }}', contentType: '{{ steps.ambience.output.contentType }}' },
        },
        {
          id: 'storeTheme',
          capability: 'storage',
          provider: 'r2',
          params: { key: 'pack/theme.mp3', bytes: '{{ steps.theme.output.bytes }}', contentType: '{{ steps.theme.output.contentType }}' },
        },
        {
          id: 'storeCover',
          capability: 'storage',
          provider: 'r2',
          params: { key: 'pack/cover.png', bytes: '{{ steps.cover.output.bytes }}', contentType: '{{ steps.cover.output.contentType }}' },
        },
      ],
      output: {
        mood: '{{ steps.mood.output.text }}',
        ambienceUrl: '{{ steps.storeAmbience.output.url }}',
        themeUrl: '{{ steps.storeTheme.output.url }}',
        coverUrl: '{{ steps.storeCover.output.url }}',
      },
    },
  },
  {
    id: 'promo-teaser',
    label: 'Product promo teaser',
    blurb: 'Copy → key visual → image-to-video teaser → CDN. Anthropic + Replicate + KIE + R2.',
    caps: ['text', 'image', 'video', 'storage'],
    providers: ['anthropic', 'replicate', 'kie', 'r2'],
    goal: 'Turn a product line into a vertical promo teaser: write a one-line tagline (Claude), generate a key visual (Replicate), store it, animate it into a 9:16 720p teaser with audio (KIE), and return the tagline plus the video URL.',
    inputs: { product: 'a modular travel backpack that unzips into a daypack' },
    workflow: {
      description: 'Product promo teaser — text→image→video→storage',
      inputs: { product: { type: 'string', required: true, description: 'The product' } },
      steps: [
        {
          id: 'tagline',
          capability: 'text',
          provider: 'anthropic',
          params: {
            messages: [
              { role: 'system', content: 'Reply with one sharp product tagline. No quotes.' },
              { role: 'user', content: '{{ inputs.product }}' },
            ],
          },
        },
        {
          id: 'keyVisual',
          capability: 'image',
          provider: 'replicate',
          params: { prompt: 'Vertical product hero, clean studio light: {{ inputs.product }}', aspectRatio: '9:16', quality: 'high' },
        },
        {
          id: 'storeVisual',
          capability: 'storage',
          provider: 'r2',
          params: { key: 'promo/key-visual.png', bytes: '{{ steps.keyVisual.output.bytes }}', contentType: '{{ steps.keyVisual.output.contentType }}' },
        },
        {
          id: 'teaser',
          capability: 'video',
          provider: 'kie',
          params: {
            prompt: 'Slow push-in product reveal: {{ steps.tagline.output.text }}',
            firstFrameUrl: '{{ steps.storeVisual.output.url }}',
            durationSec: 5,
            resolution: '720p',
            aspectRatio: '9:16',
            generateAudio: true,
          },
        },
      ],
      output: {
        tagline: '{{ steps.tagline.output.text }}',
        keyVisualUrl: '{{ steps.storeVisual.output.url }}',
        videoUrl: '{{ steps.teaser.output.url }}',
      },
    },
  },
]
