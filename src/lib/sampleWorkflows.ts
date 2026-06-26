/**
 * Pre-authored sample workflows — the "canned authoring" path. Each is a real
 * `Workflow` object that passes `validateWorkflow` against the fake registry,
 * so it can be validated and run instantly with zero API calls. They double as
 * the seed for the optional "Compile with Claude" (BYOK) path: the natural
 * language `goal` is what gets sent to `compileWorkflow`.
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
  /** Natural-language goal — sent verbatim to compileWorkflow when a key is present. */
  goal: string
  /** Default run inputs (keys must match workflow.inputs). */
  inputs: Record<string, unknown>
  workflow: Workflow
}

export const SAMPLES: Sample[] = [
  {
    id: 'rain',
    label: 'Relaxing rain soundscape',
    blurb: 'A loopable rain track plus a hand-painted cover, both stored to a CDN.',
    caps: ['audio', 'image', 'storage'],
    goal: 'Create a relaxing rain soundscape: a 60-second loopable instrumental ambience track and a hand-painted watercolour cover image. Store both files and return their URLs.',
    inputs: { brief: 'soft rain on a tin roof at dusk, distant thunder, cosy' },
    workflow: {
      description: 'Relaxing rain soundscape with a hand-painted cover',
      inputs: { brief: { type: 'string', required: true, description: 'The mood/scene brief' } },
      steps: [
        {
          id: 'cover',
          capability: 'image',
          params: { prompt: 'Hand-painted watercolour album cover, no text: {{ inputs.brief }}', aspectRatio: '1:1', quality: 'high' },
        },
        {
          id: 'ambience',
          capability: 'audio',
          params: { kind: 'music', prompt: '{{ inputs.brief }}, gentle rainfall, seamless loop', durationSec: 60, instrumental: true, loop: true },
        },
        {
          id: 'storeCover',
          capability: 'storage',
          params: { key: 'rain/cover.png', bytes: '{{ steps.cover.output.bytes }}', contentType: '{{ steps.cover.output.contentType }}' },
        },
        {
          id: 'storeAudio',
          capability: 'storage',
          params: { key: 'rain/ambience.mp3', bytes: '{{ steps.ambience.output.bytes }}', contentType: '{{ steps.ambience.output.contentType }}' },
        },
      ],
      output: {
        coverUrl: '{{ steps.storeCover.output.url }}',
        audioUrl: '{{ steps.storeAudio.output.url }}',
      },
    },
  },
  {
    id: 'ugc',
    label: 'AI UGC video from a concept',
    blurb: 'Script → product keyframe → image-to-video clip → stored MP4.',
    caps: ['text', 'image', 'video', 'storage'],
    goal: 'Turn a product concept into a short vertical UGC video: write a 5-second hook script, generate a product keyframe image, store it, then animate it into a 1080p 9:16 clip with audio. Return the script text and the video URL.',
    inputs: { concept: 'a refillable glass water bottle with a bamboo cap' },
    workflow: {
      description: 'AI UGC video from a product concept',
      inputs: { concept: { type: 'string', required: true, description: 'The product concept' } },
      steps: [
        {
          id: 'script',
          capability: 'text',
          params: {
            messages: [
              { role: 'system', content: 'You are a short-form UGC scriptwriter. Reply with one punchy 5-second hook.' },
              { role: 'user', content: 'Write a UGC hook for: {{ inputs.concept }}' },
            ],
          },
        },
        {
          id: 'keyframe',
          capability: 'image',
          params: { prompt: 'Photoreal vertical product hero shot, soft studio light: {{ inputs.concept }}', aspectRatio: '9:16', quality: 'high' },
        },
        {
          id: 'storeFrame',
          capability: 'storage',
          params: { key: 'ugc/keyframe.png', bytes: '{{ steps.keyframe.output.bytes }}', contentType: '{{ steps.keyframe.output.contentType }}' },
        },
        {
          id: 'clip',
          capability: 'video',
          params: {
            prompt: 'Animate the product hero: {{ steps.script.output.text }}',
            firstFrameUrl: '{{ steps.storeFrame.output.url }}',
            durationSec: 5,
            resolution: '1080p',
            aspectRatio: '9:16',
            generateAudio: true,
          },
        },
      ],
      output: {
        script: '{{ steps.script.output.text }}',
        videoUrl: '{{ steps.clip.output.url }}',
      },
    },
  },
  {
    id: 'book',
    label: "Kids' book page",
    blurb: 'A storybook illustration plus warm narration, both stored.',
    caps: ['image', 'audio', 'storage'],
    goal: "Produce one kids' book page: a soft gouache children's illustration and a warm spoken narration of the page text. Store both and return their URLs.",
    inputs: { page: 'a small fox finds a glowing mushroom in a moonlit forest' },
    workflow: {
      description: "Kids' book page: illustration + narration",
      inputs: { page: { type: 'string', required: true, description: 'The page text / scene' } },
      steps: [
        {
          id: 'illustration',
          capability: 'image',
          params: { prompt: "Children's book illustration, soft gouache, warm palette: {{ inputs.page }}", aspectRatio: '4:3', quality: 'high' },
        },
        {
          id: 'narration',
          capability: 'audio',
          params: { kind: 'speech', prompt: '{{ inputs.page }}', voiceId: 'warm-storyteller' },
        },
        {
          id: 'storeArt',
          capability: 'storage',
          params: { key: 'book/page-01.png', bytes: '{{ steps.illustration.output.bytes }}', contentType: '{{ steps.illustration.output.contentType }}' },
        },
        {
          id: 'storeVoice',
          capability: 'storage',
          params: { key: 'book/page-01.mp3', bytes: '{{ steps.narration.output.bytes }}', contentType: '{{ steps.narration.output.contentType }}' },
        },
      ],
      output: {
        artUrl: '{{ steps.storeArt.output.url }}',
        narrationUrl: '{{ steps.storeVoice.output.url }}',
      },
    },
  },
]
