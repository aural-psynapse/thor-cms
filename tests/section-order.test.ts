import { describe, expect, it } from 'vitest'
import { moveSection } from '@/panel/lib/section-order'

const page = [
  { id: 'top', fixed: true },
  { id: 'a' },
  { id: 'b' },
  { id: 'c' },
  { id: 'footer', fixed: true },
]

const ids = (list: { id: string }[]) => list.map((s) => s.id)

describe('moving a section', () => {
  it('moves one section down past another', () => {
    expect(ids(moveSection(page, 'a', 'c'))).toEqual(['top', 'b', 'c', 'a', 'footer'])
  })

  it('moves one section up', () => {
    expect(ids(moveSection(page, 'c', 'a'))).toEqual(['top', 'c', 'a', 'b', 'footer'])
  })

  it('never moves a fixed section, nor anything onto one', () => {
    expect(moveSection(page, 'top', 'b')).toBe(page)
    expect(moveSection(page, 'a', 'footer')).toBe(page)
  })

  it('keeps a fixed section in the middle of the page where it is', () => {
    const middle = [{ id: 'a' }, { id: 'm', fixed: true }, { id: 'b' }]
    expect(ids(moveSection(middle, 'a', 'b'))).toEqual(['b', 'm', 'a'])
  })
})
