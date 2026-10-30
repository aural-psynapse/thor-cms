import { useState } from 'react'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { AskFirst } from './ask-first'
import { IconButton } from './icon-button'
import { addItem, itemsIn, moveItem, reorderWithin } from './lib/item-order'
import type { PictureRule } from './lib/picture-rules'
import type { Item, ItemsValue } from './lib/values'
import { MediaField } from './media-field'
import type { FilesSlot } from './slots'
import { SortableList } from './sortable-list'
import { WORDS } from './words'

/** The items of one folder. */
export type ItemListProps = {
  value: ItemsValue
  /** The folder shown, or null for the items in no folder. */
  collection: string | null
  /** The rule every thumbnail is held to. */
  rule: PictureRule
  onChange: (next: ItemsValue) => void
  /** Back to the folders. */
  onBack: () => void
  upload: FilesSlot['upload']
  onLook?: () => void
  disabled?: boolean
}

/**
 * The items of one folder, top to bottom, in the order they appear on the
 * site. Dragging one changes that order; "Move to" puts it in another folder.
 */
export function ItemList({
  value,
  collection,
  rule,
  onChange,
  onBack,
  upload,
  onLook,
  disabled = false,
}: ItemListProps) {
  const [asking, setAsking] = useState<Item | null>(null)
  const shown = itemsIn(value.items, collection)
  const folder = value.collections.find((c) => c.id === collection)

  function edit(next: Item) {
    onChange({ ...value, items: value.items.map((i) => (i.id === next.id ? next : i)) })
  }

  return (
    <div className='space-y-2'>
      <div className='space-y-2'>
        <Button type='button' variant='ghost' className='-ms-2 h-8 gap-2 px-2' onClick={onBack}>
          <ArrowLeft className='size-4' />
          {WORDS.items.allFolders}
        </Button>
        <h3 className='px-1 text-sm font-medium'>{folder?.name ?? WORDS.items.notInFolder}</h3>
      </div>

      {shown.length === 0 && (
        <p className='text-muted-foreground px-1 text-sm'>{WORDS.items.nothingInHere}</p>
      )}

      <SortableList
        items={shown}
        onMove={(from, to) =>
          onChange({ ...value, items: reorderWithin(value.items, collection, from, to) })
        }
        renderRow={(item, row) => (
          <Card
            ref={row.ref}
            style={row.style}
            data-item={item.id}
            className={cn('gap-3 p-3', row.isDragging && 'z-10 shadow-lg')}
          >
            <div className='flex items-center gap-2'>
              {row.handle}
              <select
                aria-label={WORDS.items.moveTo(item.name || WORDS.items.thisItem)}
                className='border-input bg-background h-8 min-w-0 flex-1 rounded-md border px-2 text-sm'
                value={item.collection ?? ''}
                disabled={disabled}
                onChange={(event) =>
                  onChange({
                    ...value,
                    items: moveItem(value.items, item.id, event.target.value || null),
                  })
                }
              >
                {value.collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {WORDS.items.inFolder(c.name)}
                  </option>
                ))}
                <option value=''>{WORDS.items.inNoFolder}</option>
              </select>
              <IconButton
                label={WORDS.items.remove(item.name || WORDS.items.thisItem)}
                disabled={disabled}
                onClick={() => setAsking(item)}
              >
                <Trash2 />
              </IconButton>
            </div>

            <div className='space-y-1'>
              <Label htmlFor={`${item.id}-name`}>{WORDS.items.name}</Label>
              <Input
                id={`${item.id}-name`}
                value={item.name}
                disabled={disabled}
                onFocus={onLook}
                onChange={(event) => edit({ ...item, name: event.target.value })}
              />
            </div>
            <div className='space-y-1'>
              <Label htmlFor={`${item.id}-tag`}>{WORDS.items.tag}</Label>
              <Input
                id={`${item.id}-tag`}
                value={item.tag}
                disabled={disabled}
                onFocus={onLook}
                onChange={(event) => edit({ ...item, tag: event.target.value })}
              />
            </div>
            <MediaField
              label={WORDS.items.pictureOf(item.name || WORDS.items.thisItem)}
              rule={rule}
              url={item.picture}
              upload={upload}
              onLook={onLook}
              disabled={disabled}
              onChange={(picture) => edit({ ...item, picture })}
            />
          </Card>
        )}
      />

      <AskFirst
        open={asking !== null}
        onOpenChange={(open) => !open && setAsking(null)}
        title={WORDS.items.removeTitle(asking?.name || WORDS.items.thisItem)}
        action={WORDS.ask.remove}
        onConfirm={() => {
          if (asking) onChange({ ...value, items: value.items.filter((i) => i.id !== asking.id) })
          setAsking(null)
        }}
      >
        {WORDS.ask.comesOff}
      </AskFirst>

      <Button
        type='button'
        variant='outline'
        className='w-full gap-2'
        disabled={disabled}
        onClick={() => onChange(addItem(value, collection))}
      >
        <Plus className='size-4' /> {WORDS.items.add}
      </Button>
    </div>
  )
}
