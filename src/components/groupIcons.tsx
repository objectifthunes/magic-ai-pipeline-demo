import { BookOpen, Boxes, Workflow, Plug, ListTree, type LucideIcon } from 'lucide-react'
import type { GroupId } from './exports'

export const GROUP_ICONS: Record<GroupId, LucideIcon> = {
  'guides':      BookOpen,
  'ai-core':     Boxes,
  'ai-workflow': Workflow,
  'providers':   Plug,
}

/** Use this for sidebar nav items + group eyebrows. */
export function GroupIcon({ group, size = 12 }: { group: GroupId; size?: number }) {
  const Icon = GROUP_ICONS[group] ?? ListTree
  return <Icon size={size} strokeWidth={1.75} />
}
