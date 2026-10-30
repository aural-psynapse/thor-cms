// Links the site points to: social accounts, a shop, anything with an address.

import type { Platform } from '../field-list'

/** The platforms a links box offers when the field list names none. */
export const DEFAULT_PLATFORMS: Platform[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'x', label: 'X' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'threads', label: 'Threads' },
  { id: 'website', label: 'Website' },
]

/**
 * What she typed has to be a link the browser will follow, or the page ends
 * up with a dead one on it.
 */
export function linkProblem(url: string): string | null {
  if (!/^https?:\/\/[^\s/]+\.\S+$/i.test(url.trim())) return 'A link starts with https://'
  return null
}

/** The name of a platform, from the field list, or the id itself when unknown. */
export function platformLabel(platforms: Platform[], id: string): string {
  return platforms.find((p) => p.id === id)?.label ?? id
}
