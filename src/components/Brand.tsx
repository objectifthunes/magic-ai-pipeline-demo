import Link from 'next/link'

/** Sidebar brand block — small logo, "SDK" eyebrow, name, version line. */
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Magic AI Pipeline home">
      <span className="brand__mark" aria-hidden>
        <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
          {/* three nodes flowing into one — a pipeline in a glyph */}
          <circle cx="7" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="7" cy="16" r="2.6" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="7" cy="24" r="2.6" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="25" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9.6 8 Q18 8 22.4 14.6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9.6 16 H22" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9.6 24 Q18 24 22.4 17.4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </span>
      <span className="brand__text">
        <span className="brand__eyebrow">SDK · DEMO</span>
        <span className="brand__name">Magic AI Pipeline</span>
        <span className="brand__meta">English → validated workflow</span>
      </span>
    </Link>
  )
}
