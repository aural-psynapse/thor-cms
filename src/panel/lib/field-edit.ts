// Changes the owner makes on the Fields page: adding, renaming, retyping,
// reordering and removing boxes and sections. A box keeps its key when it is
// renamed, so its saved value stays with it.

import type { Content, FieldType, StoredField, StoredSection } from '../field-list'
import { SQUARE, WIDE } from './picture-rules'
import { arrayMove, moveSection } from './section-order'
import { newId } from './values'
import { VIDEO } from './video-check'

/** What is wrong with a field list, in one plain sentence, or nothing. */
export function fieldListProblem(sections: StoredSection[]): string | null {
  const ids = new Set<string>()
  for (const section of sections) {
    if (section.label.trim() === '') return 'Every section needs a name.'
    if (ids.has(section.id)) {
      return `Two sections are called "${section.id}". Give one of them another name.`
    }
    ids.add(section.id)
    const keys = new Set<string>()
    for (const field of section.fields) {
      if (field.label.trim() === '') return `Every box in ${section.label} needs a name.`
      if (keys.has(field.key)) {
        return `Two boxes in ${section.label} are called "${field.key}". Give one of them another name.`
      }
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
  if (name === '') return { problem: 'Give the new box a name.' }
  const section = sections.find((s) => s.id === sectionId)
  if (!section) return { problem: 'That section is gone.' }
  const key = newId(name, [])
  // the same key, or a box she already calls by that name
  if (section.fields.some((f) => f.key === key || sameName(f.label, name))) {
    return { problem: `There is already a box called "${name}" in ${section.label}. Pick another name.` }
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
  if (name === '') return { problem: 'Give the new section a name.' }
  const id = newId(name, [])
  if (sections.some((s) => s.id === id || sameName(s.label, name))) {
    return { problem: `There is already a section called "${name}". Pick another name.` }
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
