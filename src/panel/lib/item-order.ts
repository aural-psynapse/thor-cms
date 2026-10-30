// Ordering items and moving them between folders. All items of a list sit in
// one array in page order; a folder's items are the ones that name it, in the
// order they come in that array.

import { WORDS } from '../words'
import { arrayMove } from './section-order'
import { newId, type Collection, type Item, type ItemsValue } from './values'

/** The items in one folder, or in none when `collection` is null, in order. */
export function itemsIn(items: Item[], collection: string | null): Item[] {
  return items.filter((item) => item.collection === collection)
}

/** How many items one folder holds. */
export function countIn(items: Item[], collection: string | null): number {
  return itemsIn(items, collection).length
}

/** "1 item", "3 items". */
export function itemCount(n: number): string {
  return WORDS.items.count(n)
}

/**
 * Puts item `fromId` where `toId` is inside one folder. Items in other
 * folders keep their places in the array.
 */
export function reorderWithin(
  items: Item[],
  collection: string | null,
  fromId: string,
  toId: string,
): Item[] {
  const inside = itemsIn(items, collection)
  const from = inside.findIndex((i) => i.id === fromId)
  const to = inside.findIndex((i) => i.id === toId)
  if (from < 0 || to < 0 || from === to) return items
  const moved = arrayMove(inside, from, to)
  let next = 0
  return items.map((item) => (item.collection === collection ? (moved[next++] ?? item) : item))
}

/** Moves one item into another folder, or into none, at the end of it. */
export function moveItem(items: Item[], id: string, to: string | null): Item[] {
  const item = items.find((i) => i.id === id)
  if (!item || item.collection === to) return items
  return [...items.filter((i) => i.id !== id), { ...item, collection: to }]
}

/**
 * Deletes a folder. Its items are kept, in no folder, which takes them off
 * the site until she puts them somewhere.
 */
export function removeCollection(value: ItemsValue, id: string): ItemsValue {
  return {
    collections: value.collections.filter((c) => c.id !== id),
    items: value.items.map((i) => (i.collection === id ? { ...i, collection: null } : i)),
  }
}

/** Adds an empty folder with this name at the end. */
export function addCollection(value: ItemsValue, name: string): ItemsValue {
  const collection: Collection = {
    id: newId(name, value.collections.map((c) => c.id)),
    name,
  }
  return { ...value, collections: [...value.collections, collection] }
}

/** Adds an empty item at the end of a folder. */
export function addItem(value: ItemsValue, collection: string | null): ItemsValue {
  const item: Item = {
    id: newId('item', value.items.map((i) => i.id)),
    name: '',
    tag: '',
    picture: '',
    collection,
  }
  return { ...value, items: [...value.items, item] }
}
