import type { ComponentProps, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/** The one green in the panel: a button that puts something on the site. */
export const GREEN =
  'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700'

/** The red for a button that takes something off the site. */
export const RED = 'bg-destructive text-white hover:bg-destructive/90'

/**
 * What a button does, told by its colour, the same way on every page: green
 * puts something in, red takes something out, grey is everything else.
 */
export type Tone = 'plain' | 'go' | 'stop' | 'quiet'

/** A button with only an icon on it, and the words it says when rested on. */
export type IconButtonProps = ComponentProps<typeof Button> & {
  /** Said when the pointer rests on it, and read out by a screen reader. */
  label: string
  tone?: Tone
  children: ReactNode
}

/**
 * A button with nothing but a picture on it always says what it does when the
 * pointer rests on it, so the owner never has to guess.
 */
export function IconButton({
  label,
  tone = 'plain',
  children,
  className,
  ...rest
}: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type='button'
          variant={tone === 'quiet' ? 'outline' : tone === 'plain' ? 'ghost' : 'default'}
          size='icon'
          aria-label={label}
          className={cn(
            'size-8',
            tone === 'plain' && 'text-muted-foreground',
            tone === 'go' && GREEN,
            tone === 'stop' && RED,
            className,
          )}
          {...rest}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
