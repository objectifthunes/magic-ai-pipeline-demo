'use client'

import dynamic from 'next/dynamic'

// The Studio is browser-only: it runs the engines client-side and lazily pulls
// the Anthropic SDK on the BYOK path. Never render it on the server.
const WorkflowStudio = dynamic(() => import('./WorkflowStudio'), {
  ssr: false,
  loading: () => (
    <div className="studio studio--loading">
      <div className="studio__skeleton">loading the live studio…</div>
    </div>
  ),
})

export function StudioMount() {
  return <WorkflowStudio />
}
