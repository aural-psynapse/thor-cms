import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'

/** The little square that shows what a box holds. */
export type ThumbProps = {
  /** The picture's address, or empty. */
  url: string
  /** Drawn instead when there is no picture, or it will not load. */
  icon: LucideIcon
}

/**
 * The little square on a picture box. Whenever there is nothing to show, or
 * the picture will not load, this draws a plain icon instead of a torn page.
 */
export function Thumb({ url, icon: Icon }: ThumbProps) {
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    setBroken(false)
  }, [url])

  if (url === '' || broken) {
    return (
      <span
        data-thumb='icon'
        className='bg-muted text-muted-foreground flex size-16 shrink-0 items-center justify-center rounded-md border'
      >
        <Icon className='size-6' />
      </span>
    )
  }

  return (
    <span className='bg-muted size-16 shrink-0 overflow-hidden rounded-md border'>
      <img
        src={url}
        alt=''
        className='h-full w-full object-cover'
        onError={() => setBroken(true)}
      />
    </span>
  )
}
