// Changes the owner makes on the Fields page: adding, renaming, retyping,
// reordering and removing boxes and sections. A box keeps its key when it is
// renamed, so its saved value stays with it.

import type { Content, FieldType, StoredField, StoredSection } from '../field-list'
import { SQUARE, WIDE } from './picture-rules'
import { arrayMove, moveSection } from './section-order'
import { newId } from './values'
import { VIDEO } from './video-check'
import { WORDS } from '../words'

/** What is wrong with a field list, in one plain sentence, or nothing. */
export function fieldListProblem(sections: StoredSection[]): string | null {
  const ids = new Set<string>()
  for (const section of sections) {
    if (section.label.trim() === '') return WORDS.fields.sectionNeedsName
    if (ids.has(section.id)) return WORDS.fields.twoSections(section.id)
    ids.add(section.id)
    const keys = new Set<string>()
    for (const field of section.fields) {
      if (field.label.trim() === '') return WORDS.fields.boxNeedsName(section.label)
      if (keys.has(field.key)) return WORDS.fields.twoBoxes(section.label, field.key)
      keys.add(field.key)
    }
  }
  return null
}

/** A box of this type with the shipped rule it needs, if any. */
export function makeField(key: string, label: string, type: FieldType): StoredField {
  switch (type) {
    case 'picture':
      return { key, label, type, rule: WIDE }
    case 'pictures':
    case 'items':
      return { key, label, type, rule: SQUARE }
    case 'video':
      return { key, label, type, rule: VIDEO }
    default:
      return { key, label, type }
  }
}

/** The same box as another type. Its key and name stay. */
export function retype(field: StoredField, type: FieldType): StoredField {
  return field.type === type ? field : makeField(field.key, field.label, type)
}

/** Retypes a box and drops its saved value, which the new type cannot read. */
export function retypeField(content: Content, sectionId: string, key: string, type: FieldType): Content {
  const field = content.sections.find((s) => s.id === sectionId)?.fields.find((f) => f.key === key)
  if (!field || field.type === type) return content
  const { [key]: _dropped, ...kept } = content.values[sectionId] ?? {}
  return {
    sections: content.sections.map((s) =>
      s.id === sectionId ? { ...s, fields: s.fields.map((f) => (f.key === key ? retype(f, type) : f)) } : s,
    ),
    values: { ...content.values, [sectionId]: kept },
  }
}

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

/** The result of adding: the new list, or why it was refused. */
export type Added = { sections: StoredSection[] } | { problem: string }

/** Adds a box at the end of a section, refusing a name already used there. */
export function addField(
  sections: StoredSection[],
  sectionId: string,
  label: string,
  type: FieldType,
): Added {
  const name = label.trim()
  if (name === '') return { problem: WORDS.fields.nameNewBox }
  const section = sections.find((s) => s.id === sectionId)
  if (!section) return { problem: WORDS.fields.sectionGone }
  const key = newId(name, [])
  // the same key, or a box she already calls by that name
  if (section.fields.some((f) => f.key === key || sameName(f.label, name))) {
    return { problem: WORDS.fields.boxTaken(name, section.label) }
  }
  return {
    sections: sections.map((s) =>
      s.id === sectionId ? { ...s, fields: [...s.fields, makeField(key, name, type)] } : s,
    ),
  }
}

/** Adds an empty section before the last fixed one, refusing a name already used. */
export function addSection(sections: StoredSection[], label: string): Added {
  const name = label.trim()
  if (name === '') return { problem: WORDS.fields.nameNewSection }
  const id = newId(name, [])
  if (sections.some((s) => s.id === id || sameName(s.label, name))) {
    return { problem: WORDS.fields.sectionTaken(name) }
  }
  const fresh: StoredSection = { id, label: name, fields: [] }
  // A footer held at the bottom stays the last thing on the page.
  const last = sections.at(-1)
  return {
    sections: last?.fixed ? [...sections.slice(0, -1), fresh, last] : [...sections, fresh],
  }
}

/** Moves a box one place up (-1) or down (1) inside its section. */
export function nudgeField(sections: StoredSection[], sectionId: string, key: string, by: -1 | 1): StoredSection[] {
  return sections.map((s) => {
    if (s.id !== sectionId) return s
    const at = s.fields.findIndex((f) => f.key === key)
    const to = at + by
    if (at < 0 || to < 0 || to >= s.fields.length) return s
    return { ...s, fields: arrayMove(s.fields, at, to) }
  })
}

/** Moves a section one place up (-1) or down (1), past fixed sections. */
export function nudgeSection(sections: StoredSection[], id: string, by: -1 | 1): StoredSection[] {
  const movable = sections.filter((s) => !s.fixed)
  const at = movable.findIndex((s) => s.id === id)
  const next = movable[at + by]
  return next ? moveSection(sections, id, next.id) : sections
}

/** Removes a box and the value saved under it. */
export function removeField(content: Content, sectionId: string, key: string): Content {
  const { [key]: _dropped, ...kept } = content.values[sectionId] ?? {}
  return {
    sections: content.sections.map((s) =>
      s.id === sectionId ? { ...s, fields: s.fields.filter((f) => f.key !== key) } : s,
    ),
    values: { ...content.values, [sectionId]: kept },
  }
}

/** Removes a section and every value saved in it. */
export function removeSection(content: Content, sectionId: string): Content {
  const { [sectionId]: _dropped, ...kept } = content.values
  return { sections: content.sections.filter((s) => s.id !== sectionId), values: kept }
}
