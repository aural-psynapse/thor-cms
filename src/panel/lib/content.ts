// Small changes to the content the panel holds, kept out of the panel itself
// so each can be read on its own.

import type { Content, JsonValue } from '../field-list'

/** True when the two hold exactly the same field list and values. */
export function sameContent(a: Content | null, b: Content | null): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/** The content with one box's value changed. */
export function withValue(
  content: Content,
  section: string,
  key: string,
  value: JsonValue,
): Content {
  const inside = content.values[section] ?? {}
  return { ...content, values: { ...content.values, [section]: { ...inside, [key]: value } } }
}

/** A picked video waiting for Save, and the box it belongs to. */
export type WaitingVideo = { section: string; key: string; file: File }

/** Every video box whose value is a file picked and not yet sent. */
export function videosWaiting(content: Content, pending: Map<string, File>): WaitingVideo[] {
  const found: WaitingVideo[] = []
  for (const section of content.sections) {
    for (const field of section.fields) {
      if (field.type !== 'video') continue
      const value = content.values[section.id]?.[field.key]
      const file = typeof value === 'string' ? pending.get(value) : undefined
      if (file) found.push({ section: section.id, key: field.key, file })
    }
  }
  return found
}
