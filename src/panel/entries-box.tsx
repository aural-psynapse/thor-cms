import { useState } from 'react'
import { ArrowLeft, ChevronRight, FileText, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { AskFirst } from './ask-first'
import type { EntriesField, JsonValue } from './field-list'
import { FieldBox, type FieldTools } from './field-box'
import { IconButton } from './icon-button'
import { arrayMove } from './lib/section-order'
import { newId, readText, type Entry } from './lib/values'
import { SortableList } from './sortable-list'
import { Thumb } from './thumb'
import { WORDS } from './words'

/** A list of entries: each one opens to show its own boxes. */
export type EntriesBoxProps = {
  field: EntriesField
  entries: Entry[]
  onChange: (next: Entry[]) => void
  onLook: () => void
  tools: FieldTools
}

/**
 * The entries in page order, dragged to reorder. Opening one swaps the list
 * for that entry's boxes, with a way back above them.
 */
export function EntriesBox({ field, entries, onChange, onLook, tools }: EntriesBoxProps) {
  const [open, setOpen] = useState<string | null>(null)
  const [asking, setAsking] = useState<Entry | null>(null)
  const name = (entry: Entry) => readText(entry.values[field.titleKey]) || WORDS.entries.untitled(field.one)
  const opened = entries.find((e) => e.id === open)

  function edit(id: string, key: string, value: JsonValue) {
    onChange(entries.map((e) => (e.id === id ? { ...e, values: { ...e.values, [key]: value } } : e)))
  }

  if (opened) {
    return (
      <div className='space-y-3' data-entry={opened.id}>
        <Button type='button' variant='ghost' className='-ms-2 h-8 gap-2 px-2' onClick={() => setOpen(null)}>
          <ArrowLeft className='size-4' />
          {WORDS.entries.back(field.label)}
        </Button>
        <h3 className='px-1 text-sm font-medium'>{name(opened)}</h3>
        {field.fields.map((box) => (
          <FieldBox
            key={box.key}
            field={box}
            value={opened.values[box.key]}
            onChange={(next) => edit(opened.id, box.key, next)}
            onLook={onLook}
            tools={tools}
          />
        ))}
      </div>
    )
  }

  return (
    <div className='space-y-2' data-entries={field.key}>
      <h3 className='px-1 text-sm font-medium'>{field.label}</h3>
      {entries.length === 0 && <p className='text-muted-foreground px-1 text-sm'>{WORDS.entries.none(field.one)}</p>}
      <SortableList
        items={entries}
        onMove={(from, to) => {
          const at = (id: string) => entries.findIndex((e) => e.id === id)
          onChange(arrayMove(entries, at(from), at(to)))
        }}
        renderRow={(entry, row) => (
          <Card
            ref={row.ref}
            style={row.style}
            data-entry-row={entry.id}
            className={cn('flex-row items-center gap-2 p-2', row.isDragging && 'z-10 shadow-lg')}
          >
            {row.handle}
            <button
              type='button'
              aria-label={WORDS.entries.open(name(entry))}
              className='flex min-w-0 flex-1 items-center gap-3 text-start'
              disabled={tools.disabled}
              onClick={() => {
                setOpen(entry.id)
                onLook()
              }}
            >
              {field.pictureKey && (
                <Thumb url={readText(entry.values[field.pictureKey])} icon={FileText} />
              )}
              <span className='truncate text-sm'>{name(entry)}</span>
              <ChevronRight className='text-muted-foreground ms-auto size-4 shrink-0' />
            </button>
            <IconButton
              label={WORDS.entries.remove(name(entry))}
              disabled={tools.disabled}
              onClick={() => setAsking(entry)}
            >
              <Trash2 />
            </IconButton>
          </Card>
        )}
      />
      <Button
        type='button'
        variant='outline'
        className='w-full gap-2'
        disabled={tools.disabled}
        onClick={() => {
          const id = newId(field.one, entries.map((e) => e.id))
          onChange([...entries, { id, values: {} }])
          setOpen(id)
          onLook()
        }}
      >
        <Plus className='size-4' />
        {WORDS.entries.add(field.one)}
      </Button>

      <AskFirst
        open={asking !== null}
        onOpenChange={(next) => !next && setAsking(null)}
        title={asking ? WORDS.entries.removeTitle(name(asking)) : ''}
        action={WORDS.ask.remove}
        onConfirm={() => {
          if (asking) onChange(entries.filter((e) => e.id !== asking.id))
          setAsking(null)
        }}
      >
        {WORDS.ask.comesOff}
      </AskFirst>
    </div>
  )
}
