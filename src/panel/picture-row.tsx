import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AskFirst } from './ask-first'
import { IconButton } from './icon-button'
import type { PictureRule } from './lib/picture-rules'
import { MediaField } from './media-field'
import type { FilesSlot } from './slots'

/** A row of pictures held to one rule. */
export type PictureRowProps = {
  label: string
  rule: PictureRule
  urls: string[]
  onChange: (next: string[]) => void
  upload: FilesSlot['upload']
  onLook?: () => void
  disabled?: boolean
}

/**
 * A row of pictures, like a gallery: each one is its own picture box, more
 * can be added, and removing one asks first.
 */
export function PictureRow({
  label,
  rule,
  urls,
  onChange,
  upload,
  onLook,
  disabled = false,
}: PictureRowProps) {
  const [asking, setAsking] = useState<number | null>(null)

  return (
    <div className='space-y-2'>
      <h3 className='px-1 text-sm font-medium'>{label}</h3>
      {urls.map((url, at) => (
        <div key={at} className='flex items-center gap-2'>
          <div className='min-w-0 flex-1'>
            <MediaField
              label={`Picture ${at + 1}`}
              rule={rule}
              url={url}
              upload={upload}
              onLook={onLook}
              disabled={disabled}
              onChange={(next) => onChange(urls.map((u, i) => (i === at ? next : u)))}
            />
          </div>
          <IconButton
            label={`Remove picture ${at + 1}`}
            disabled={disabled}
            onClick={() => setAsking(at)}
          >
            <Trash2 />
          </IconButton>
        </div>
      ))}

      <AskFirst
        open={asking !== null}
        onOpenChange={(open) => !open && setAsking(null)}
        title={`Remove picture ${(asking ?? 0) + 1}?`}
        action='Remove'
        onConfirm={() => {
          onChange(urls.filter((_, i) => i !== asking))
          setAsking(null)
        }}
      >
        It comes off the site when you save.
      </AskFirst>

      <Button
        type='button'
        variant='outline'
        className='w-full gap-2'
        disabled={disabled}
        onClick={() => onChange([...urls, ''])}
      >
        <Plus className='size-4' /> Add a picture
      </Button>
    </div>
  )
}
