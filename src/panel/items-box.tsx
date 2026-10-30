import { useState } from 'react'
import { CollectionList } from './collection-list'
import { ItemList } from './item-list'
import type { PictureRule } from './lib/picture-rules'
import type { ItemsValue } from './lib/values'
import type { FilesSlot } from './slots'

/** A list of items in folders, as one box in a section. */
export type ItemsBoxProps = {
  label: string
  rule: PictureRule
  value: ItemsValue
  onChange: (next: ItemsValue) => void
  upload: FilesSlot['upload']
  onLook?: () => void
  disabled?: boolean
}

/** The folders first; opening one shows its items. */
export function ItemsBox({ label, rule, value, onChange, upload, onLook, disabled }: ItemsBoxProps) {
  // undefined: the folders are showing. null: the items in no folder.
  const [open, setOpen] = useState<string | null | undefined>(undefined)

  return (
    <div className='space-y-2'>
      <h3 className='px-1 text-sm font-medium'>{label}</h3>
      {open === undefined ? (
        <CollectionList value={value} onChange={onChange} onOpen={setOpen} disabled={disabled} />
      ) : (
        <ItemList
          value={value}
          collection={open}
          rule={rule}
          onChange={onChange}
          onBack={() => setOpen(undefined)}
          upload={upload}
          onLook={onLook}
          disabled={disabled}
        />
      )}
    </div>
  )
}
