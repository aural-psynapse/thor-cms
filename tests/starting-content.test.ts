import { describe, expect, it } from 'vitest'
import { startingContent, type Content, type FieldList } from '@/panel/field-list'

const code: FieldList = [
  { id: 'top', label: 'Top bar', fixed: true, fields: [{ key: 'name', label: 'Name', type: 'text' }] },
  { id: 'hero', label: 'Hero', fields: [{ key: 'title', label: 'Heading', type: 'text' }] },
  { id: 'faq', label: 'Questions', fields: [{ key: 'q', label: 'Question', type: 'text' }] },
  { id: 'seo', label: 'Search', page: 'settings', fields: [{ key: 'title', label: 'Title', type: 'text' }] },
  { id: 'footer', label: 'Footer', fixed: true, fields: [] },
]

const saved: Content = {
  sections: [
    { id: 'top', label: 'Top bar', fields: [{ key: 'name', label: 'Name', type: 'text' }] },
    { id: 'faq', label: 'Old questions', hidden: true, fields: [{ key: 'q', label: 'Question', type: 'text' }] },
    { id: 'hero', label: 'Hero', fields: [] },
    { id: 'gone', label: 'Gone', fields: [] },
    { id: 'footer', label: 'Footer', fields: [] },
  ],
  values: { hero: { title: 'Hello' } },
}

describe('the content the panel starts from', () => {
  it('starts from the code list when nothing is saved', () => {
    const start = startingContent(code, null, false)
    expect(start.sections.map((s) => s.id)).toEqual(['top', 'hero', 'faq', 'seo', 'footer'])
    expect(start.values).toEqual({})
  })

  it('takes the code list when the owner cannot edit fields, keeping her order and switches', () => {
    const start = startingContent(code, saved, false)
    // "seo" is new: it goes in right after "faq", the section before it in code.
    expect(start.sections.map((s) => s.id)).toEqual(['top', 'faq', 'seo', 'hero', 'footer'])
    const faq = start.sections.find((s) => s.id === 'faq')!
    expect(faq.label).toBe('Questions')
    expect(faq.hidden).toBe(true)
    expect(start.sections.find((s) => s.id === 'hero')!.fields.map((f) => f.key)).toEqual(['title'])
    expect(start.sections.find((s) => s.id === 'seo')!.page).toBe('settings')
    expect(start.values).toEqual({ hero: { title: 'Hello' } })
  })

  it('keeps her saved list when she can edit fields, with page, fixed and locked from the code', () => {
    const start = startingContent(code, saved, true)
    expect(start.sections.map((s) => s.id)).toEqual(['top', 'faq', 'hero', 'gone', 'footer'])
    expect(start.sections.find((s) => s.id === 'faq')!.label).toBe('Old questions')
    expect(start.sections.find((s) => s.id === 'top')!.fixed).toBe(true)
    expect(start.sections.find((s) => s.id === 'footer')!.fixed).toBe(true)
  })
})
