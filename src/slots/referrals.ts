// FAKE. Replace this file per site: keep the referrals wherever the site keeps
// them, and make the site record each visit that comes through one.

import type { Referral } from '@/panel/lib/referrals'
import type { ReferralsSlot } from '@/panel/slots'

/** Keeps the referrals in memory, newest first. */
export function fakeReferrals(site: string, start: Referral[] = [], reserved: string[] = ['admin']): ReferralsSlot {
  let kept = [...start]
  let made = 0
  return {
    site,
    reserved,
    list: async () => [...kept],
    add: async (referral) => {
      if (kept.some((r) => r.path === referral.path) || reserved.includes(referral.path)) {
        throw new Error(`the address ${referral.path} is already in use`)
      }
      made += 1
      const one = { ...referral, id: `r${Date.now().toString(36)}${made}` }
      kept = [one, ...kept]
      return one
    },
    remove: async (id) => {
      kept = kept.filter((r) => r.id !== id)
    },
  }
}
