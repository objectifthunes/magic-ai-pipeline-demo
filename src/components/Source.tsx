import { Code2 } from 'lucide-react'
import { CodeBlock } from './CodeBlock'
import { Eyebrow } from './Eyebrow'
import type { CodeLang } from '@/lib/highlight'

interface SourceProps {
  code: string
  lang?: CodeLang
  /** Override the "SOURCE" eyebrow label, e.g. "USAGE" or "SERVER". */
  label?: string
}

/** A code block under a "SOURCE" eyebrow. */
export async function Source({ code, lang = 'tsx', label = 'SOURCE' }: SourceProps) {
  return (
    <div className="export-block">
      <Eyebrow icon={<Code2 size={12} strokeWidth={1.75} />}>{label}</Eyebrow>
      <CodeBlock code={code} lang={lang} />
    </div>
  )
}
