import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AskFirst } from './ask-first'
import { GREEN } from './icon-button'

/** How far a save has got, from the press of Save to the live site. */
export type SaveStage =
  | { name: 'resting' }
  | { name: 'sending'; done: number }
  | { name: 'saving' }
  | { name: 'waiting' }
  | { name: 'live' }
  | { name: 'stuck'; problem: string }

/** The bar at the bottom: what is happening, and Save and Cancel. */
export type SaveBarProps = {
  /** Something is changed and not saved. */
  dirty: boolean
  stage: SaveStage
  /** A box said something went wrong, shown here in red. */
  problem?: string | null
  onSave: () => void
  onCancel: () => void
}

function said(stage: SaveStage): string {
  switch (stage.name) {
    case 'sending':
      return `Sending the video, ${Math.round(stage.done * 100)}%`
    case 'saving':
      return 'Saving…'
    case 'waiting':
      return 'Saved. Putting it on the site…'
    case 'live':
      return 'Your change is on the live site.'
    default:
      return ''
  }
}

/**
 * The bar holding Save and Cancel. It sits at the bottom of the screen and
 * only appears when something is unsaved or a save is under way, so a change
 * is never lost by accident. The padding underneath keeps the buttons clear
 * of the address bar a phone draws over the bottom of the screen.
 */
export function SaveBar({ dirty, stage, problem, onSave, onCancel }: SaveBarProps) {
  const [asking, setAsking] = useState(false)
  const busy = stage.name === 'sending' || stage.name === 'saving'
  const red = stage.name === 'stuck' ? stage.problem : problem
  const words = said(stage)

  return (
    <div className='bg-background shrink-0 border-t pb-[env(safe-area-inset-bottom)]'>
      <div className='flex flex-wrap items-center justify-end gap-3 px-4 py-3'>
        <span role='status' className='me-auto text-sm'>
          {red ? (
            <span className='text-destructive'>{red}</span>
          ) : (
            <span className='text-muted-foreground'>{words}</span>
          )}
          {stage.name === 'sending' && !red && (
            <span
              role='progressbar'
              aria-label='Sending the video'
              aria-valuenow={Math.round(stage.done * 100)}
              className='bg-muted mt-1 block h-1.5 w-48 max-w-full overflow-hidden rounded-full'
            >
              <span
                className='bg-primary block h-full transition-[width]'
                style={{ width: `${Math.round(stage.done * 100)}%` }}
              />
            </span>
          )}
        </span>

        {dirty && (
          <>
            <Button
              type='button'
              variant='outline'
              disabled={busy}
              onClick={() => setAsking(true)}
            >
              Cancel
            </Button>
            <AskFirst
              open={asking}
              onOpenChange={setAsking}
              title='Throw away your changes?'
              action='Throw away'
              onConfirm={onCancel}
            >
              Everything goes back to how it was when you last saved.
            </AskFirst>

            <Button
              type='button'
              className={cn('gap-2', GREEN)}
              disabled={busy}
              onClick={onSave}
            >
              {busy && <LoaderCircle className='size-4 animate-spin' />}
              Save
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
