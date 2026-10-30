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

type Mark = Pick<SimpleIcon, 'path' | 'hex'> & { evenOdd?: boolean }

// Simple Icons dropped LinkedIn at LinkedIn's request, so this one is drawn
// here: the "in" cut out of a rounded square.
const LINKEDIN: Mark = {
  hex: '0A66C2',
  evenOdd: true,
  path:
    'M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z' +
    'M7 5.5a1.5 1.5 0 1 1 0 3a1.5 1.5 0 1 1 0-3z' +
    'M5.75 10h2.5v8h-2.5z' +
    'M10.5 10h2.4v1.2c.5-.8 1.5-1.4 2.8-1.4c2.1 0 3.3 1.3 3.3 3.8V18h-2.5v-4c0-1.2-.5-1.9-1.5-1.9s-1.6.7-1.6 1.9v4h-2.9z',
}

// The real mark of each platform, drawn from Simple Icons. lucide carries no
// brand marks, so these come from there and nowhere else.
const MARKS: Record<string, Mark> = {
  linkedin: LINKEDIN,
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
      <path d={mark.path} fillRule={mark.evenOdd ? 'evenodd' : undefined} />
    </svg>
  )
}
