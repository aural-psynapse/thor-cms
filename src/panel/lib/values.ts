// Reading a saved value as the kind of box it belongs to. A value saved under
// one type and read under another, after the owner changed a box's type on the
// Fields page, comes back empty rather than breaking the box.

import type { JsonValue } from '../field-list'

/** One thing in a list of items: a product, a team member, an example. */
export type Item = {
  id: string
  name: string
  tag: string
  /** The thumbnail's address, or empty. */
  picture: string
  /** The folder it is in, or null for none, which keeps it off the site. */
  collection: string | null
}

/** A folder of items, shown on the page as one group with its heading. */
export type Collection = { id: string; name: string }

/** What a list-of-items box holds. */
export type ItemsValue = { items: Item[]; collections: Collection[] }

/** One link: the platform, the words the page shows, and where it goes. */
export type Link = { id: string; platform: string; text: string; url: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function records(list: unknown): Record<string, unknown>[] {
  return Array.isArray(list) ? list.filter(isRecord) : []
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/** The words in a text box, or empty. */
export function readText(value: JsonValue | undefined): string {
  return str(value)
}

/** The addresses in a row of pictures, or none. */
export function readPictures(value: JsonValue | undefined): string[] {
  return Array.isArray(value) ? value.map(str) : []
}

/** The items and folders in a list-of-items box, or none. */
export function readItems(value: JsonValue | undefined): ItemsValue {
  if (!isRecord(value)) return { items: [], collections: [] }
  return {
    items: records(value.items).map((i) => ({
      id: str(i.id),
      name: str(i.name),
      tag: str(i.tag),
      picture: str(i.picture),
      collection: typeof i.collection === 'string' ? i.collection : null,
    })),
    collections: records(value.collections).map((c) => ({ id: str(c.id), name: str(c.name) })),
  }
}

/** The links in a list-of-links box, or none. */
export function readLinks(value: JsonValue | undefined): Link[] {
  return records(value).map((l) => ({
    id: str(l.id),
    platform: str(l.platform),
    text: str(l.text),
    url: str(l.url),
  }))
}

/**
 * A short id that is not in `taken`, made from the words given: "Summer sale"
 * becomes summer-sale, then summer-sale-2 if that is used.
 */
export function newId(words: string, taken: string[]): string {
  const base =
    words
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'new'
  if (!taken.includes(base)) return base
  let n = 2
  while (taken.includes(`${base}-${n}`)) n++
  return `${base}-${n}`
}
