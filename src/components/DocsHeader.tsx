'use client'

import { ThemeToggle } from '@objectifthunes/whiteboard'
import Link from 'next/link'
import { useThemeMode } from './ThemeProvider'

export function DocsHeader() {
  const { theme, toggle } = useThemeMode()
  return (
    <header className="docs-header">
      <Link href="/" className="docs-header__crumb">
        Magic AI Pipeline · SDK reference
      </Link>
      <div className="docs-header__actions">
        <a
          href="https://www.npmjs.com/package/@objectifthunes/ai-workflow"
          target="_blank"
          rel="noopener noreferrer"
          className="docs-header__link"
        >
          npm
        </a>
        <Link href="/studio/" className="docs-header__link">
          studio
        </Link>
        <ThemeToggle theme={theme} onToggle={toggle} />
      </div>
    </header>
  )
}
