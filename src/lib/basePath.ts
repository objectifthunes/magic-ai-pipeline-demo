/** The GitHub Pages base path (empty in local dev). Set in next.config.ts. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/** Prefix a public-asset path with the deploy base path. */
export function withBase(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  return `${BASE_PATH}${clean}`
}
