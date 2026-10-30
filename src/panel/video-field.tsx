import { useRef, useState } from 'react'
import { FileVideo, Replace } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { IconButton } from './icon-button'
import { saysType } from './lib/picture-rules'
import {
  measureVideo,
  saysShapes,
  videoFileProblem,
  videoShapeProblem,
  type VideoRule,
} from './lib/video-check'
import { Thumb } from './thumb'

/** One place on the site where a video goes. */
export type VideoFieldProps = {
  label: string
  rule: VideoRule
  /** A video is already on the site here. */
  has: boolean
  /** The name of a file she picked that goes up when she saves. */
  pickedName?: string
  /** A file that passed every check. */
  onPick: (file: File) => void
  onLook?: () => void
  disabled?: boolean
}

/**
 * The video box. Picking a file checks its type, size and shape and says in
 * one sentence what is wrong. A good file waits on her computer and goes to
 * the files code when she saves; until then the preview plays it from there.
 */
export function VideoField({
  label,
  rule,
  has,
  pickedName,
  onPick,
  onLook,
  disabled = false,
}: VideoFieldProps) {
  const [over, setOver] = useState(false)
  const [refused, setRefused] = useState<string | null>(null)
  const chooser = useRef<HTMLInputElement>(null)
  const filled = has || pickedName !== undefined

  async function take(file: File | undefined) {
    if (!file) return
    setRefused(null)
    const wrongFile = videoFileProblem(file, rule)
    if (wrongFile) {
      setRefused(wrongFile)
      return
    }
    const size = await measureVideo(file)
    const wrongShape = videoShapeProblem(size.width, size.height, rule)
    if (wrongShape) {
      setRefused(wrongShape)
      return
    }
    onPick(file)
  }

  return (
    <Card
      data-video={label}
      onClick={() => onLook?.()}
      onDragOver={(event) => {
        event.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault()
        setOver(false)
        if (!disabled) void take(event.dataTransfer.files[0])
      }}
      className={cn(
        'flex-row items-center gap-3 border-dashed p-3',
        refused && 'border-destructive bg-destructive/5',
        over && 'border-primary bg-primary/5',
      )}
    >
      <Thumb url='' icon={FileVideo} />

      <span className='min-w-0 flex-1'>
        <span className='block truncate text-sm font-medium'>{label}</span>

        {/* A refused file is the only thing worth reading, so it takes the
            place of the size rules until she picks another. */}
        {refused && <span className='text-destructive block text-xs'>{refused}</span>}

        {!refused && !filled && (
          <span className='text-muted-foreground block text-xs whitespace-pre-line'>
            {`${saysType(rule.types)}, up to ${rule.biggestMb} MB\n${saysShapes(rule)}`}
          </span>
        )}

        {/* Without this the box looks exactly as empty after a file has gone
            up as before, which reads as nothing having happened. */}
        {!refused && has && pickedName === undefined && (
          <span className='text-muted-foreground block text-xs'>
            A video is on this box. Replace swaps it.
          </span>
        )}

        {!refused && pickedName !== undefined && (
          <span className='text-muted-foreground block truncate text-xs'>
            {`${pickedName}, goes up when you save`}
          </span>
        )}
      </span>

      <input
        ref={chooser}
        type='file'
        accept={rule.types.join(',')}
        className='hidden'
        data-testid={`file-${label}`}
        onChange={(event) => {
          void take(event.target.files?.[0])
          event.target.value = ''
        }}
      />

      <IconButton
        // Replacing throws the old video off this box, so it is red.
        label={filled ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
        tone={filled ? 'stop' : 'quiet'}
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation()
          chooser.current?.click()
        }}
      >
        {filled ? <Replace /> : <FileVideo />}
      </IconButton>
    </Card>
  )
}
