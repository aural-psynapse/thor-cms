// How many people came to the site, what they watched and pressed, and where
// from. The numbers code fills this in from whatever counts visits for the
// site; the Numbers page only draws it.

import { WORDS } from '../words'

/** One day's count. `date` is written 2026-09-18. */
export type DayCount = { date: string; count: number }

/** A place they came from, and how many visits came from it. */
export type SourceCount = { name: string; visits: number }

/** A country by its two letters, GB or LT, and how many visits came from it. */
export type CountryCount = { code: string; visits: number }

/** A link they pressed, by the link's id in a links box, and how many times. */
export type TapCount = { link: string; count: number }

/** Seconds spent on one section, by its id, over this many visits. */
export type StayCount = { section: string; seconds: number; visits: number }

/** One video, how often it was played, and how long people stayed. */
export type VideoCount = {
  id: string
  title: string
  /** A picture of the video, or empty for the plain film icon. */
  poster: string
  plays: number
  /** Seconds, the usual stay on this video. */
  usualStay: number
  /** Seconds, how long the video runs. */
  length: number
}

/** Everything the Numbers page draws, for one period. */
export type Numbers = {
  /** False when counting is not switched on for the site yet. */
  ready: boolean
  visits: DayCount[]
  plays: DayCount[]
  /** Seconds watched, all videos together. */
  watched: number
  /** Out of 100: how far into a video people get, on average. */
  watchedThrough: number
  videos: VideoCount[]
  sources: SourceCount[]
  countries: CountryCount[]
  taps: TapCount[]
  stays: StayCount[]
}

/** Visits and plays on the same day, which is what the charts draw. */
export type ByDay = { date: string; visits: number; plays: number }

/**
 * Visits and plays laid over the same days. A day with only one of the two
 * still shows, with a zero for the other, and the days come out in order.
 */
export function joinDays(visits: DayCount[], plays: DayCount[]): ByDay[] {
  const seen = new Map(visits.map((d) => [d.date, d.count]))
  const played = new Map(plays.map((d) => [d.date, d.count]))
  const dates = new Set([...seen.keys(), ...played.keys()])
  return [...dates].sort().map((date) => ({
    date,
    visits: seen.get(date) ?? 0,
    plays: played.get(date) ?? 0,
  }))
}

/** The two regional letters a phone and a laptop both draw as a flag. */
export function flagOf(code: string): string {
  const two = code.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(two)) return ''
  return String.fromCodePoint(...[...two].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65))
}

/** The name people actually say for a country's two letters. */
export function countryName(code: string): string {
  const two = code.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(two)) return code
  try {
    return new Intl.DisplayNames([WORDS.locale], { type: 'region' }).of(two) ?? code
  } catch {
    return code
  }
}

/** "3m 20s", or "48s" for anything under a minute. */
export function asTime(seconds: number): string {
  const whole = Math.round(seconds)
  if (whole < 60) return `${whole}s`
  const minutes = Math.floor(whole / 60)
  if (minutes < 60) return `${minutes}m ${whole % 60}s`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

/** Numbers with nothing counted yet. */
export function emptyNumbers(): Numbers {
  return {
    ready: true,
    visits: [],
    plays: [],
    watched: 0,
    watchedThrough: 0,
    videos: [],
    sources: [],
    countries: [],
    taps: [],
    stays: [],
  }
}

/** Adds up a list of day counts. */
export function total(days: DayCount[]): number {
  return days.reduce((sum, d) => sum + d.count, 0)
}
