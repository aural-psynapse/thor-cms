import { useState } from 'react'
import { Check, ChevronRight, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { AskFirst } from './ask-first'
import { IconButton } from './icon-button'
import { addCollection, countIn, itemCount, removeCollection } from './lib/item-order'
import { arrayMove } from './lib/section-order'
import type { Collection, ItemsValue } from './lib/values'
import { SortableList } from './sortable-list'
import { WORDS } from './words'

/** The folders of one list of items. */
export type CollectionListProps = {
  value: ItemsValue
  onChange: (next: ItemsValue) => void
  /** Opens a folder's items; null opens the items in no folder. */
  onOpen: (id: string | null) => void
  disabled?: boolean
}

/**
 * The folders, in the order they appear on the site. She drags them, renames
 * them, deletes them and makes new ones here; the items are one level in.
 */
export function CollectionList({ value, onChange, onOpen, disabled = false }: CollectionListProps) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [asking, setAsking] = useState<Collection | null>(null)
  const loose = countIn(value.items, null)

  function rename(id: string, name: string) {
    onChange({
      ...value,
      collections: value.collections.map((c) => (c.id === id ? { ...c, name } : c)),
    })
  }

  function add() {
    const name = newName.trim()
    if (name === '') return
    onChange(addCollection(value, name))
    setNewName('')
    setAdding(false)
  }

  const askingCount = asking ? countIn(value.items, asking.id) : 0

  return (
    <div className='space-y-2'>
      <SortableList
        items={value.collections}
        onMove={(from, to) => {
          const at = (id: string) => value.collections.findIndex((c) => c.id === id)
          onChange({ ...value, collections: arrayMove(value.collections, at(from), at(to)) })
        }}
        renderRow={(collection, row) => {
          const count = countIn(value.items, collection.id)
          return (
            <Card
              ref={row.ref}
              style={row.style}
              data-collection={collection.id}
              className={cn('gap-3 p-3', row.isDragging && 'z-10 shadow-lg')}
            >
              <div className='flex items-center gap-2'>
                {row.handle}
                <span className='text-muted-foreground min-w-0 flex-1 truncate text-xs'>
                  {count === 0 ? WORDS.folders.empty : itemCount(count)}
                </span>
                <IconButton
                  label={WORDS.folders.delete(collection.name)}
                  disabled={disabled}
                  onClick={() => setAsking(collection)}
                >
                  <Trash2 />
                </IconButton>
                <IconButton label={WORDS.folders.open} onClick={() => onOpen(collection.id)}>
                  <ChevronRight />
                </IconButton>
              </div>
              <div className='space-y-1'>
                <Label htmlFor={`${collection.id}-name`}>{WORDS.folders.name}</Label>
                <Input
                  id={`${collection.id}-name`}
                  value={collection.name}
                  disabled={disabled}
                  onChange={(event) => rename(collection.id, event.target.value)}
                />
              </div>
            </Card>
          )
        }}
      />

      <AskFirst
        open={asking !== null}
        onOpenChange={(open) => !open && setAsking(null)}
        title={WORDS.folders.deleteTitle(asking?.name ?? '')}
        action={WORDS.ask.delete}
        onConfirm={() => {
          if (asking) onChange(removeCollection(value, asking.id))
          setAsking(null)
        }}
      >
        {askingCount === 0
          ? WORDS.folders.deleteEmpty
          : WORDS.folders.deleteFull(itemCount(askingCount))}
      </AskFirst>

      {/* Where the items of a deleted folder wait, so nothing gets lost. */}
      {loose > 0 && (
        <Card
          onClick={() => onOpen(null)}
          className='cursor-pointer flex-row items-center gap-2 border-dashed p-3'
        >
          <span className='size-8' />
          <span className='min-w-0 flex-1'>
            <span className='block truncate text-sm font-medium'>{WORDS.items.notInFolder}</span>
            <span className='text-muted-foreground block text-xs'>
              {WORDS.folders.loose(itemCount(loose))}
            </span>
          </span>
          <ChevronRight className='text-muted-foreground size-4' />
        </Card>
      )}

      {adding ? (
        <Card className='flex-row items-center gap-2 p-3'>
          <Input
            autoFocus
            value={newName}
            aria-label={WORDS.folders.newName}
            className='h-8 flex-1'
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                add()
              }
              if (event.key === 'Escape') setAdding(false)
            }}
          />
          <IconButton label={WORDS.folders.add} tone='go' onClick={add}>
            <Check />
          </IconButton>
          <IconButton label={WORDS.folders.dontAdd} tone='quiet' onClick={() => setAdding(false)}>
            <X />
          </IconButton>
        </Card>
      ) : (
        <Button
          type='button'
          variant='outline'
          className='w-full gap-2'
          disabled={disabled}
          onClick={() => setAdding(true)}
        >
          <Plus className='size-4' /> {WORDS.folders.addFolder}
        </Button>
      )}
    </div>
  )
}
