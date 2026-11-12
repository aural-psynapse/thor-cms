// FAKE. Replace this file per site: fetch the numbers from whatever counts the
// site's visitors, and fill in the Numbers shape.

import type { Numbers } from '@/panel/lib/numbers'
import type { NumbersSlot } from '@/panel/slots'

/** The ids the fake numbers talk about, so they match the demo site. */
export type FakeNumbersIds = { sections: string[]; links: string[]; videos: string[] }

// The same made-up numbers every time, so the page does not jump about.
function wobble(n: number): number {
  return Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1
}

/** Made-up numbers for the last `days` days, shaped like a real small site. */
export function fakeNumbers(ids: FakeNumbersIds, today = new Date()): NumbersSlot {
  return {
    load: async (days): Promise<Numbers> => {
      const dates = Array.from({ length: days }, (_, i) => {
        const when = new Date(today.getTime() - (days - 1 - i) * 86_400_000)
        return when.toISOString().slice(0, 10)
      })
      return {
        ready: true,
        visits: dates.map((date, i) => ({ date, count: Math.round(20 + wobble(i) * 40) })),
        plays: dates.map((date, i) => ({ date, count: Math.round(5 + wobble(i + 99) * 15) })),
        watched: days * 410,
        watchedThrough: 64,
        videos: ids.videos.map((id, i) => ({
          id,
          title: id,
          poster: '',
          plays: 80 - i * 20,
          usualStay: 21 - i * 3,
          length: 30,
        })),
        sources: [
          { name: 'Typed or saved', visits: days * 9 },
          { name: 'google.com', visits: days * 6 },
          { name: 'instagram.com', visits: days * 4 },
        ],
        countries: [
          { code: 'GB', visits: days * 8 },
          { code: 'DE', visits: days * 5 },
          { code: 'US', visits: days * 3 },
        ],
        taps: ids.links.map((link, i) => ({ link, count: days - i * 2 })),
        stays: ids.sections.map((section, i) => ({
          section,
          seconds: days * (40 - i * 5),
          visits: days,
        })),
      }
    },
  }
}
