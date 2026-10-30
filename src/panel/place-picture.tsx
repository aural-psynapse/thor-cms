import { useEffect, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GREEN } from './icon-button'
import { MIDDLE, cutToShape, type Framing } from './lib/shrink-picture'

/** The step between picking a picture and sending it. */
export type PlacePictureProps = {
  file: File
  /** The shape of the box, as width over height. */
  ratio: number
  /** What this picture is for, so she knows which box she is filling. */
  label: string
  /** How wide the site draws this box; the frame she drags in is that size. */
  drawnWide: number
  onKeep: (at: Framing) => void
  onCancel: () => void
}

/**
 * Every box on the site has a shape of its own, and a picture that is not that
 * shape has to lose something. This is where the owner says what it loses: the
 * picture fills a frame the shape of the box and she drags it until the right
 * part is inside. The picture is cut before it goes up, so what is stored is
 * exactly what visitors see, and nothing is squashed.
 */
export function PlacePicture({
  file,
  ratio,
  label,
  drawnWide,
  onKeep,
  onCancel,
}: PlacePictureProps) {
  const [url, setUrl] = useState('')
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)
  const [at, setAt] = useState<Framing>(MIDDLE)
  const dragging = useRef<{ x: number; y: number; from: Framing } | null>(null)
  const frame = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const seeAt = URL.createObjectURL(file)
    setUrl(seeAt)
    const picture = new Image()
    picture.onload = () =>
      setSize({ width: picture.naturalWidth, height: picture.naturalHeight })
    picture.src = seeAt
    // Stop the load before the address goes, or the browser logs a missing
    // file each time the box closes mid-load.
    return () => {
      picture.onload = null
      picture.removeAttribute('src')
      URL.revokeObjectURL(seeAt)
    }
  }, [file])

  // How much of the picture is off the edge of the frame in each direction.
  // Dragging can only move it by that much.
  const keep = size ? cutToShape(size.width, size.height, ratio, at) : null
  const spare = size && keep
    ? { wide: size.width - keep.width, tall: size.height - keep.height }
    : { wide: 0, tall: 0 }
  const canDrag = spare.wide > 1 || spare.tall > 1

  useEffect(() => {
    if (!canDrag) return
    function onMove(e: PointerEvent) {
      const held = dragging.current
      const box = frame.current
      if (!held || !box) return
      const shown = box.getBoundingClientRect()
      // A drag across the whole frame moves the picture across all of its
      // spare, so the picture keeps up with her hand.
      const acrossX = spare.wide > 0 ? (held.x - e.clientX) / shown.width : 0
      const acrossY = spare.tall > 0 ? (held.y - e.clientY) / shown.height : 0
      const hold = (n: number) => Math.min(1, Math.max(0, n))
      setAt({ wide: hold(held.from.wide + acrossX), tall: hold(held.from.tall + acrossY) })
    }
    function onUp() {
      dragging.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [canDrag, spare.wide, spare.tall])

  return (
    <div className='flex w-full flex-col gap-3'>
      <p className='text-sm font-medium'>
        {canDrag ? `Drag ${label.toLowerCase()} to choose what shows` : label}
      </p>

      <div
        ref={frame}
        className='bg-muted relative mx-auto w-full shrink-0 touch-none overflow-hidden rounded-md border'
        style={{
          // the box's own size, shrinking only when the panel is narrower
          width: `${drawnWide}px`,
          maxWidth: '100%',
          aspectRatio: String(ratio),
          cursor: canDrag ? 'grab' : 'default',
        }}
        onPointerDown={(e) => {
          if (canDrag) dragging.current = { x: e.clientX, y: e.clientY, from: at }
        }}
      >
        {url && (
          <img
            src={url}
            alt=''
            draggable={false}
            className='pointer-events-none size-full object-cover select-none'
            style={{ objectPosition: `${Math.round(at.wide * 100)}% ${Math.round(at.tall * 100)}%` }}
          />
        )}
      </div>

      <p className='text-muted-foreground text-xs'>
        This box is the size the site draws it. Only what you can see here goes on the site.
      </p>

      <div className='flex justify-end gap-2'>
        <Button type='button' variant='outline' onClick={onCancel}>
          <X /> Cancel
        </Button>
        <Button type='button' className={GREEN} onClick={() => onKeep(at)}>
          <Check /> Use this
        </Button>
      </div>
    </div>
  )
}
