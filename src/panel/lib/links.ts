// Links the site points to: social accounts, a shop, anything with an address.

import type { Content, Platform } from '../field-list'
import { readLinks } from './values'

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

/** One link on the site, with its platform's name, for the Numbers page. */
export type NamedLink = { id: string; platform: string; platformName: string; text: string }

/** Every link in every links box of the content, with its platform's name. */
export function allLinks(content: Content): NamedLink[] {
  const found: NamedLink[] = []
  for (const section of content.sections) {
    for (const field of section.fields) {
      if (field.type !== 'links') continue
      const platforms = field.platforms ?? DEFAULT_PLATFORMS
      for (const link of readLinks(content.values[section.id]?.[field.key])) {
        found.push({
          id: link.id,
          platform: link.platform,
          platformName: platformLabel(platforms, link.platform),
          text: link.text,
        })
      }
    }
  }
  return found
}

/** The name of a platform, from the field list, or the id itself when unknown. */
export function platformLabel(platforms: Platform[], id: string): string {
  return platforms.find((p) => p.id === id)?.label ?? id
}
