// The field list: every section of the site, in page order, and the boxes in
// each one. The panel draws itself from this and nothing else, so a new site
// needs a new list and no new panel code.

import type { ReactNode } from 'react'
import type { PictureRule } from './lib/picture-rules'
import type { VideoRule } from './lib/video-check'
import { WORDS } from './words'

/** Anything that can be written as JSON. Every saved value is one of these. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

/** What every box has: the name the content keeps it under, and its label. */
export type FieldBase = {
  /** Unique inside its section. The content keeps the value under this. */
  key: string
  /** What the owner reads above the box. */
  label: string
}

/** One line of words, or a bigger box for paragraphs. */
export type TextField = FieldBase & { type: 'text' | 'longText' }

/** One picture, cut and shrunk to the rule before it goes up. */
export type PictureField = FieldBase & { type: 'picture'; rule: PictureRule }

/** A row of pictures, each held to the same rule. */
export type PictureRowField = FieldBase & { type: 'pictures'; rule: PictureRule }

/** One video, checked against the rule and sent when the owner saves. */
export type VideoField = FieldBase & { type: 'video'; rule: VideoRule }

/** A list of items in folders, each with a thumbnail held to the rule. */
export type ItemsField = FieldBase & { type: 'items'; rule: PictureRule }

/** A place a link can point to, and what the owner calls it. */
export type Platform = { id: string; label: string }

/** A list of links, each with its platform. Platforms default to a common set. */
export type LinksField = FieldBase & { type: 'links'; platforms?: Platform[] }

/** What a custom box receives. It draws whatever the site needs from these. */
export type CustomFieldProps = {
  value: JsonValue | undefined
  onChange: (next: JsonValue) => void
  /** True while a save is running, so nothing changes under it. */
  disabled: boolean
}

/** Draws a custom box. */
export type CustomRender = (props: CustomFieldProps) => ReactNode

/**
 * A box the list cannot describe. Its render lives in code; a saved field
 * list keeps only the key and label, and the panel finds the render again by
 * key from the list in code.
 */
export type CustomField = FieldBase & { type: 'custom'; render?: CustomRender }

/** Any one box. */
export type Field =
  | TextField
  | PictureField
  | PictureRowField
  | VideoField
  | ItemsField
  | LinksField
  | CustomField

/** The kinds of box, by name. */
export type FieldType = Field['type']

/** A box as it is saved: the same, minus a custom box's render. */
export type StoredField = Exclude<Field, CustomField> | Omit<CustomField, 'render'>

/** One band of the page, with its boxes. */
export type Section<F = Field> = {
  /** Unique in the list. The content keeps this section's values under it. */
  id: string
  label: string
  /** Held in place: no dragging, no switching off. The top bar, the footer. */
  fixed?: boolean
  /** Nothing inside to change, so it does not open. */
  locked?: boolean
  /** Switched off: kept, but not on the site. */
  hidden?: boolean
  /**
   * 'settings' for a section that is not a band of the page, like the search
   * engine title or the contact details. It leaves the Edit page's list and
   * shows on the Settings page instead.
   */
  page?: 'settings'
  fields: F[]
}

/** The field list as the agent writes it in code. */
export type FieldList = Section<Field>[]

/** The field list as it is saved with the content. */
export type StoredSection = Section<StoredField>

/** Everything the panel saves: the field list and every value, by section and key. */
export type Content = {
  sections: StoredSection[]
  values: Record<string, Record<string, JsonValue>>
}

/** The kinds of box in the order the Fields page offers them, with their names. */
export const FIELD_TYPES: { type: FieldType; name: string }[] = (
  ['text', 'longText', 'picture', 'pictures', 'video', 'items', 'links', 'custom'] as const
).map((type) => ({ type, name: WORDS.fields.types[type] }))

/** The field list without its render functions, ready to save as JSON. */
export function toStored(list: FieldList): StoredSection[] {
  return list.map((section) => ({
    ...section,
    fields: section.fields.map((field): StoredField => {
      if (field.type !== 'custom') return field
      return { type: 'custom', key: field.key, label: field.label }
    }),
  }))
}

/** Every custom render in the code list, found by its key. */
export function rendersOf(list: FieldList): Map<string, CustomRender> {
  const found = new Map<string, CustomRender>()
  for (const section of list) {
    for (const field of section.fields) {
      if (field.type === 'custom' && field.render) found.set(field.key, field.render)
    }
  }
  return found
}

/**
 * The content the panel starts from. With nothing saved yet, the list in code
 * is the start and every box is empty.
 *
 * When the owner can edit the field list, the saved list is hers and wins,
 * but where a section sits (page, fixed, locked) still comes from the code.
 * When she cannot, the code list wins: only her order and the sections she
 * switched off carry over from the save.
 */
export function startingContent(list: FieldList, saved: Content | null, fieldsEditable: boolean): Content {
  const values = saved?.values ?? {}
  if (!saved || saved.sections.length === 0) return { sections: toStored(list), values }
  if (fieldsEditable) {
    const code = new Map(list.map((s) => [s.id, s]))
    return {
      sections: saved.sections.map((s) => {
        const from = code.get(s.id)
        return from ? { ...s, page: from.page, fixed: from.fixed, locked: from.locked } : s
      }),
      values,
    }
  }
  return { sections: keepOrder(toStored(list), saved.sections), values }
}

// The code's sections in the owner's saved order, with her switches. A
// section new in code goes in right after the one before it in code.
function keepOrder(code: StoredSection[], saved: StoredSection[]): StoredSection[] {
  const was = new Map(saved.map((s, i) => [s.id, { s, i }]))
  const out = code
    .filter((s) => was.has(s.id))
    .sort((a, b) => was.get(a.id)!.i - was.get(b.id)!.i)
    .map((s): StoredSection => ({ ...s, hidden: s.fixed ? undefined : was.get(s.id)!.s.hidden }))
  code.forEach((s, i) => {
    if (was.has(s.id)) return
    const before = i === 0 ? -1 : out.findIndex((o) => o.id === code[i - 1].id)
    out.splice(before + 1, 0, s)
  })
  return out
}
