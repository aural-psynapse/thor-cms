import { describe, expect, it } from 'vitest'
import {
  addCollection,
  addItem,
  countIn,
  itemsIn,
  moveItem,
  removeCollection,
  reorderWithin,
} from '@/panel/lib/item-order'
import type { Item, ItemsValue } from '@/panel/lib/values'

const item = (id: string, collection: string | null): Item => ({
  id,
  name: id,
  tag: '',
  picture: '',
  collection,
})

const items = [item('a', 'cups'), item('x', 'bowls'), item('b', 'cups'), item('c', 'cups')]
const ids = (list: Item[]) => list.map((i) => i.id)

describe('ordering items inside a folder', () => {
  it('moves one item down its folder and leaves other folders where they are', () => {
    const next = reorderWithin(items, 'cups', 'a', 'c')
    expect(ids(itemsIn(next, 'cups'))).toEqual(['b', 'c', 'a'])
    expect(next[1]?.id).toBe('x')
  })

  it('changes nothing for an item from another folder', () => {
    expect(reorderWithin(items, 'cups', 'x', 'a')).toBe(items)
  })
})

describe('moving an item between folders', () => {
  it('puts it at the end of the other folder and keeps the counts right', () => {
    const next = moveItem(items, 'a', 'bowls')
    expect(ids(itemsIn(next, 'bowls'))).toEqual(['x', 'a'])
    expect(countIn(next, 'cups')).toBe(2)
    expect(countIn(next, 'bowls')).toBe(2)
  })

  it('can take it out of every folder', () => {
    const next = moveItem(items, 'x', null)
    expect(countIn(next, null)).toBe(1)
    expect(countIn(next, 'bowls')).toBe(0)
  })
})

describe('folders', () => {
  const value: ItemsValue = {
    collections: [
      { id: 'cups', name: 'Cups' },
      { id: 'bowls', name: 'Bowls' },
    ],
    items,
  }

  it('deleting one keeps its items, in no folder', () => {
    const next = removeCollection(value, 'cups')
    expect(next.collections.map((c) => c.id)).toEqual(['bowls'])
    expect(next.items).toHaveLength(4)
    expect(countIn(next.items, null)).toBe(3)
  })

  it('a new folder gets an id from its name that is not taken', () => {
    expect(addCollection(value, 'Cups').collections.at(-1)).toEqual({ id: 'cups-2', name: 'Cups' })
  })

  it('a new item lands empty at the end of its folder', () => {
    const next = addItem(value, 'bowls')
    expect(itemsIn(next.items, 'bowls').at(-1)).toMatchObject({ id: 'item', name: '' })
  })
})
