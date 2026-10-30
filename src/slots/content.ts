// FAKE. Replace this file per site: load and save the whole content wherever
// the site keeps it, and say when a saved version is on the live site.

import type { Content } from '@/panel/field-list'
import type { ContentSlot } from '@/panel/slots'

function copy(content: Content): Content {
  return JSON.parse(JSON.stringify(content)) as Content
}

/**
 * Keeps the content in memory. A save is "live" a moment later, the way a
 * real site is live once its rebuild finishes.
 */
export function fakeContent(start: Content | null, liveAfterMs = 1500): ContentSlot {
  let kept = start ? copy(start) : null
  let version = 0
  let savedAt = 0
  return {
    load: async () => (kept ? copy(kept) : null),
    save: async (content) => {
      kept = copy(content)
      version += 1
      savedAt = Date.now()
      return { version }
    },
    isLive: async (asked) => asked <= version && Date.now() - savedAt >= liveAfterMs,
  }
}
