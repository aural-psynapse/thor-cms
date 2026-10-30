import { useRef, useState } from 'react'
import { Image as ImageIcon, ImageUp, LoaderCircle, Replace } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { IconButton } from './icon-button'
import {
  saysType,
  sizeProblem,
  typeProblem,
  wantedRatio,
  wantedSize,
  type PictureRule,
} from './lib/picture-rules'
import { MIDDLE, measurePicture, shrinkPicture, type Framing } from './lib/shrink-picture'
import { PlacePicture } from './place-picture'
import type { FilesSlot } from './slots'
import { Thumb } from './thumb'
import { WORDS } from './words'

/** How far a picture has got on its way to the site. */
type Stage =
  | { name: 'resting' }
  | { name: 'shrinking' }
  | { name: 'sending'; done: number }
  | { name: 'stuck'; problem: string }

/** One place on the site where a picture goes. */
export type MediaFieldProps = {
  label: string
  rule: PictureRule
  /** What sits there now, or empty. */
  url: string
  /** The new picture's address, once the files code has it. */
  onChange: (url: string) => void
  upload: FilesSlot['upload']
  /** Tells the preview to jump to this picture. */
  onLook?: () => void
  disabled?: boolean
}

/** What the box takes, in a few words: "PNG or JPEG, at least 1280×720". */
export function saysRule(rule: PictureRule): string {
  const types = saysType(rule.types)
  if (rule.shape.kind === 'any') {
    return WORDS.picture.takesAnyShape(types, rule.smallest)
  }
  const wide = wantedSize(rule, 16, 9)
  const size =
    rule.shape.kind === 'upright-or-wide'
      ? WORDS.picture.uprightOrWide(wide.width, wide.height)
      : `${wide.width}×${wide.height}`
  return WORDS.picture.takes(types, size)
}

/**
 * One place on the site where a picture goes, showing what sits there now.
 * The owner drops a photo on it, or presses the button and picks one. A wrong
 * file is turned away with one plain sentence on the box itself. A right one
 * is placed, shrunk in her browser, and handed to the files code.
 */
export function MediaField({
  label,
  rule,
  url,
  onChange,
  upload,
  onLook,
  disabled = false,
}: MediaFieldProps) {
  const [stage, setStage] = useState<Stage>({ name: 'resting' })
  const [over, setOver] = useState(false)
  const [placing, setPlacing] = useState<{ file: File; ratio: number } | null>(null)
  const chooser = useRef<HTMLInputElement>(null)
  const busy = stage.name === 'shrinking' || stage.name === 'sending'
  const has = url !== ''

  async function take(file: File | undefined) {
    if (!file) return
    // a new file clears whatever was wrong with the last one
    setStage({ name: 'resting' })
    if (!file.type.startsWith('image/')) {
      setStage({ name: 'stuck', problem: WORDS.picture.notAPicture })
      return
    }
    const wrongType = typeProblem(file.type, rule.types)
    if (wrongType) {
      setStage({ name: 'stuck', problem: wrongType })
      return
    }
    const size = await measurePicture(file)
    if (!size) {
      setStage({ name: 'stuck', problem: WORDS.picture.unreadable })
      return
    }
    const tooSmall = sizeProblem(size.width, size.height, rule)
    if (tooSmall) {
      setStage({ name: 'stuck', problem: tooSmall })
      return
    }
    // Before anything is sent she says which part of the picture is kept.
    const ratio = wantedRatio(rule, size.width, size.height)
    if (ratio) setPlacing({ file, ratio })
    else await send(file, null, MIDDLE)
  }

  async function send(file: File, ratio: number | null, at: Framing) {
    setPlacing(null)
    setStage({ name: 'shrinking' })
    try {
      // Her browser shrinks it, so a 6 MB phone photo leaves as a few hundred
      // kilobytes. It is cut to the box's shape at the place she chose.
      const small = await shrinkPicture(file, ratio, at)
      setStage({ name: 'sending', done: 0 })
      const address = await upload(small.body, {
        name: file.name,
        kind: 'picture',
        onProgress: (done) => setStage({ name: 'sending', done }),
      })
      onChange(address)
      setStage({ name: 'resting' })
    } catch (error) {
      setStage({ name: 'stuck', problem: WORDS.picture.didNotGoUp(String(error)) })
    }
  }

  const stuck = stage.name === 'stuck'

  return (
    <Card
      data-media={label}
      onClick={() => onLook?.()}
      onDragOver={(event) => {
        event.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault()
        setOver(false)
        if (!disabled && !busy) void take(event.dataTransfer.files[0])
      }}
      className={cn(
        'flex-row items-center gap-3 border-dashed p-3',
        over && 'border-primary bg-primary/5',
        // the file was turned away: this is the box the red line is about
        stuck && 'border-destructive bg-destructive/5',
        placing && 'flex-col items-stretch',
      )}
    >
      {placing ? (
        <PlacePicture
          file={placing.file}
          ratio={placing.ratio}
          label={label}
          drawnWide={rule.drawnWide}
          onKeep={(at) => void send(placing.file, placing.ratio, at)}
          onCancel={() => setPlacing(null)}
        />
      ) : (
        <>
          <Thumb url={url} icon={ImageIcon} />

          <span className='min-w-0 flex-1'>
            <span className='block truncate text-sm font-medium'>{label}</span>

            {stage.name === 'resting' && (
              <span className='text-muted-foreground block text-xs whitespace-pre-line'>
                {saysRule(rule)}
              </span>
            )}

            {stage.name === 'shrinking' && (
              <span className='text-muted-foreground flex items-center gap-2 text-xs'>
                <LoaderCircle className='size-3 animate-spin' />
                {WORDS.picture.shrinking}
              </span>
            )}

            {stage.name === 'sending' && (
              <span className='mt-1 block space-y-1'>
                <span className='text-muted-foreground block text-xs'>
                  {WORDS.picture.sending(Math.round(stage.done * 100))}
                </span>
                <Progress value={Math.round(stage.done * 100)} className='h-1.5' />
              </span>
            )}

            {stage.name === 'stuck' && (
              <span className='text-destructive block text-xs'>{stage.problem}</span>
            )}
          </span>

          <input
            ref={chooser}
            type='file'
            // the picker only offers the types this box takes
            accept={rule.types.join(',')}
            className='hidden'
            data-testid={`file-${label}`}
            onChange={(event) => {
              void take(event.target.files?.[0])
              // the same file picked twice in a row still counts as a pick
              event.target.value = ''
            }}
          />

          <IconButton
            // Replacing throws the old picture off this box, so it is red.
            label={has ? WORDS.picture.replace(label) : WORDS.picture.upload(label)}
            tone={has ? 'stop' : 'quiet'}
            disabled={busy || disabled}
            onClick={(event) => {
              event.stopPropagation()
              onLook?.()
              chooser.current?.click()
            }}
          >
            {has ? <Replace /> : <ImageUp />}
          </IconButton>
        </>
      )}
    </Card>
  )
}
