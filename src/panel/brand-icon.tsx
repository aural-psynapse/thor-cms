import {
  siBluesky,
  siFacebook,
  siGithub,
  siInstagram,
  siPinterest,
  siSpotify,
  siThreads,
  siTiktok,
  siWhatsapp,
  siX,
  siYoutube,
  type SimpleIcon,
} from 'simple-icons'

// The real mark of each platform, drawn from Simple Icons. lucide carries no
// brand marks, so these come from there and nowhere else.
const MARKS: Record<string, SimpleIcon> = {
  instagram: siInstagram,
  tiktok: siTiktok,
  youtube: siYoutube,
  facebook: siFacebook,
  x: siX,
  twitter: siX,
  threads: siThreads,
  pinterest: siPinterest,
  whatsapp: siWhatsapp,
  spotify: siSpotify,
  github: siGithub,
  bluesky: siBluesky,
}

/** True when the platform has a mark to draw. */
export function hasBrand(platform: string): boolean {
  return platform.toLowerCase() in MARKS
}

/**
 * Each mark in the colour the platform itself uses. Black marks, like TikTok
 * and X, stay the colour of the words around them so they read in either theme.
 */
export function brandColour(platform: string): string | undefined {
  const mark = MARKS[platform.toLowerCase()]
  if (!mark) return undefined
  return mark.hex === '000000' ? undefined : `#${mark.hex}`
}

/** One platform's mark, or nothing for a platform without one. */
export type BrandIconProps = { platform: string; className?: string }

/** Draws the platform's own mark in its own colour, or nothing at all. */
export function BrandIcon({ platform, className }: BrandIconProps) {
  const mark = MARKS[platform.toLowerCase()]
  if (!mark) return null
  return (
    <svg
      viewBox='0 0 24 24'
      className={className}
      fill='currentColor'
      style={{ color: brandColour(platform) }}
      aria-hidden='true'
      data-brand={platform.toLowerCase()}
    >
      <path d={mark.path} />
    </svg>
  )
}
