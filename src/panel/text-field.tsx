import { useId } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

/** One box of words. */
export type TextFieldBoxProps = {
  label: string
  /** A bigger box for paragraphs. */
  long: boolean
  value: string
  onChange: (next: string) => void
  /** Tells the preview to scroll to this box. */
  onLook: () => void
  disabled: boolean
}

/** A one-line box for short words, or a bigger box for paragraphs. */
export function TextFieldBox({
  label,
  long,
  value,
  onChange,
  onLook,
  disabled,
}: TextFieldBoxProps) {
  const id = useId()
  return (
    <Card
      // Clicking anywhere on the card puts the cursor in its box.
      onClick={(event) =>
        event.currentTarget.querySelector<HTMLElement>('input, textarea')?.focus()
      }
      className='cursor-text gap-2 p-4 focus-within:border-primary'
    >
      <Label htmlFor={id}>{label}</Label>
      {long ? (
        <Textarea
          id={id}
          className='min-h-32'
          value={value}
          disabled={disabled}
          onFocus={onLook}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          id={id}
          value={value}
          disabled={disabled}
          onFocus={onLook}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Card>
  )
}
