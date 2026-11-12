// A referral is a site address made for one buyer, such as
// example.com/majestic. The site records each visit that comes through it.

import { WORDS } from '../words'

/** One referral, as the referrals code stores it. */
export type Referral = {
  id: string
  /** Who it is for, as the owner says it: "Majestic". */
  name: string
  /** The person it went to: "Sarah Lee". May be empty. */
  buyer: string
  /** The day it was sent, written 2026-11-12. */
  sentOn: string
  /** The part after the site's address, without a slash: "majestic". */
  path: string
}

/** What the owner fills in to make a referral. */
export type NewReferral = Omit<Referral, 'id'>

/** One visit through a referral. */
export type ReferralVisit = {
  /** When it started, as an ISO date and time. */
  at: string
  /** How long the visit lasted. */
  seconds: number
  /** The section they spent longest on, by its id, or null. */
  longest: string | null
  /** The links they pressed, by their id in a links box, in order. */
  taps: string[]
  /** Two letters, GB or IE, when known. */
  country?: string
}

/** Every visit one referral brought in the period, newest first. */
export type ReferralVisits = { referral: string; visits: ReferralVisit[] }

// Letters with marks lose them (é becomes e); anything else becomes a dash.
export function pathFor(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * What is wrong with an address, or null when it can be used. `taken` holds
 * the other referrals' addresses and every address the site already uses.
 */
export function pathProblem(path: string, taken: string[]): PathProblem | null {
  if (path === '') return 'empty'
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path)) return 'letters'
  if (taken.includes(path)) return 'taken'
  return null
}

export type PathProblem = 'empty' | 'letters' | 'taken'

/** "12 Nov 2026" from 2026-11-12, or the text as given when it is not a date. */
export function dayName(date: string): string {
  const parts = /^(\d{4})-(\d{2})-(\d{2})/.exec(date)
  if (!parts) return date
  const day = new Date(Date.UTC(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3])))
  return day.toLocaleDateString(WORDS.locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/** The whole address the owner sends, from the site's address and the path. */
export function referralAddress(site: string, path: string): string {
  return `${site.replace(/\/+$/, '')}/${path}`
}
