import { useEffect, useRef, useState } from 'react'
import { Maximize2, Monitor, Smartphone, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PreviewSlot, PreviewUpdate } from './slots'
import { WORDS } from './words'

/** A screen the site is checked against. */
export type Screen = { name: string; width: number; height: number }

/** A phone held upright, the size most visitors arrive on. */
export const PHONE: Screen = { name: WORDS.preview.phone, width: 390, height: 844 }
/** A laptop screen, a wide 16 to 9 window. */
export const LAPTOP: Screen = { name: WORDS.preview.laptop, width: 1440, height: 810 }

/**
 * How much to shrink a screen so it fits the room, with a little margin. One
 * number for both sides, so the site inside is shrunk and never squashed; it
 * is never blown up past its real size either.
 */
export function fitScale(room: { width: number; height: number }, screen: Screen): number {
  const scale = Math.min(1, (room.width - 24) / screen.width, (room.height - 24) / screen.height)
  return Math.max(0, scale)
}

/** The site beside the boxes. */
export type PreviewPaneProps = {
  url: string
  /** The unsaved content and the box being edited. */
  update: PreviewUpdate
  push: PreviewSlot['push']
  /** Filling the whole screen. Escape leaves. */
  full: boolean
  onFull: (full: boolean) => void
  className?: string
}

/**
 * The site as it would look with what is in the boxes now. It is the real
 * page, drawn inside a window on this one, so what the owner sees here is
 * what visitors get. Nothing is saved by looking.
 */
export function PreviewPane({ url, update, push, full, onFull, className }: PreviewPaneProps) {
  const frame = useRef<HTMLIFrameElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const latest = useRef(update)
  const [room, setRoom] = useState({ width: 0, height: 0 })
  const [onPhone, setOnPhone] = useState(true)
  latest.current = update

  function send() {
    const inside = frame.current?.contentWindow
    if (inside) push(inside, latest.current)
  }

  // How much space there is, kept current as the window changes.
  useEffect(() => {
    const el = box.current
    if (!el) return
    const watch = new ResizeObserver(() =>
      setRoom({ width: el.clientWidth, height: el.clientHeight }),
    )
    watch.observe(el)
    setRoom({ width: el.clientWidth, height: el.clientHeight })
    return () => watch.disconnect()
  }, [])

  // The page inside says when it is listening; it gets the latest at once.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const said: unknown = event.data
      if (event.source !== frame.current?.contentWindow) return
      if (typeof said === 'object' && said !== null && 'thorPreview' in said) send()
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  })

  // Every keystroke, every drag, every picture she clicks.
  useEffect(send, [update, push])

  useEffect(() => {
    if (!full) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onFull(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [full, onFull])

  const screen = onPhone ? PHONE : LAPTOP
  const fit = fitScale(room, screen)

  return (
    <div
      ref={box}
      data-preview={full ? 'full' : 'beside'}
      className={cn(
        'bg-muted relative grid place-items-center overflow-hidden rounded-lg border',
        full ? 'fixed inset-0 z-50 rounded-none border-0' : className,
      )}
    >
      <span className='text-muted-foreground/60 absolute end-4 top-3 text-xs'>
        {`${screen.name} · ${screen.width} × ${screen.height}`}
      </span>

      {/* The outer box takes the shrunk size so nothing is clipped; the inner
          one stays a true screen and is zoomed down into it. Zoom, because
          Chrome draws only part of a scaled-down frame when the window is
          short, and leaves the rest white. */}
      <div
        style={{ width: screen.width * fit, height: screen.height * fit }}
        className='bg-background shrink-0 overflow-hidden rounded-xl border shadow-sm'
      >
        <div
          data-screen
          style={{
            width: screen.width,
            height: screen.height,
            zoom: fit,
          }}
        >
          <iframe
            ref={frame}
            src={url}
            title={WORDS.preview.frameTitle}
            onLoad={send}
            className='h-full w-full border-0'
          />
        </div>
      </div>

      {/* One solid strip behind the buttons, so the site never shows through. */}
      <div className='bg-background absolute end-5 bottom-5 flex gap-1 rounded-lg border p-1 shadow-sm'>
        <Button
          type='button'
          variant={onPhone ? 'default' : 'ghost'}
          size='icon'
          aria-label={WORDS.preview.phoneSize}
          title={WORDS.preview.phoneSize}
          onClick={() => setOnPhone(true)}
        >
          <Smartphone />
        </Button>
        <Button
          type='button'
          variant={onPhone ? 'ghost' : 'default'}
          size='icon'
          aria-label={WORDS.preview.laptopSize}
          title={WORDS.preview.laptopSize}
          onClick={() => setOnPhone(false)}
        >
          <Monitor />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          aria-label={full ? WORDS.preview.leaveFull : WORDS.preview.full}
          title={full ? WORDS.preview.leaveFull : WORDS.preview.full}
          onClick={() => onFull(!full)}
        >
          {full ? <X /> : <Maximize2 />}
        </Button>
      </div>
    </div>
  )
}
