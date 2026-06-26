import { createHighlighter, type Highlighter } from 'shiki'

let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: ['tsx', 'ts', 'css', 'bash', 'json'],
    })
  }
  return highlighterPromise
}

export type CodeLang = 'tsx' | 'ts' | 'css' | 'bash' | 'json'

export async function highlight(code: string, lang: CodeLang = 'tsx'): Promise<string> {
  const hl = await getHighlighter()
  return hl.codeToHtml(code.trim(), {
    lang,
    themes: { light: 'github-light', dark: 'github-dark' },
  })
}
