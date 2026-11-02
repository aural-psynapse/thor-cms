import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FIELD_TYPES, toStored, type StoredSection } from '@/panel/field-list'
import { addField, addSection, fieldListProblem, nudgeSection, retype, retypeField } from '@/panel/lib/field-edit'
import { VIDEO } from '@/panel/lib/video-check'
import { lastSaved, mountPanel, recordingSlots, testFields } from './helpers'

const stored = (): StoredSection[] => toStored(testFields)

describe('checking a field list', () => {
  it('passes the list the agent wrote', () => {
    expect(fieldListProblem(stored())).toBeNull()
  })

  it('refuses two boxes with the same key in one section, in plain words', () => {
    const list = stored().map((s) =>
      s.id === 'hero'
        ? { ...s, fields: [...s.fields, { key: 'title', label: 'Again', type: 'text' as const }] }
        : s,
    )
    expect(fieldListProblem(list)).toBe(
      'Two boxes in Hero are called "title". Give one of them another name.',
    )
  })

  it('refuses two sections with the same id', () => {
    const list = [...stored(), { id: 'hero', label: 'Hero again', fields: [] }]
    expect(fieldListProblem(list)).toMatch(/Two sections are called "hero"/)
  })

  it('refuses adding a box whose name is already used in that section', () => {
    expect(addField(stored(), 'hero', 'Title', 'text')).toEqual({
      problem: 'There is already a box called "Title" in Hero. Pick another name.',
    })
  })

  it('adds a new section before a footer held at the bottom', () => {
    const added = addSection(stored(), 'Prices')
    if ('problem' in added) throw new Error(added.problem)
    expect(added.sections.map((s) => s.id).slice(-2)).toEqual(['prices', 'footer'])
  })

  it('moves sections past each other but never past a fixed one', () => {
    expect(nudgeSection(stored(), 'hero', -1).map((s) => s.id)[0]).toBe('top')
    expect(nudgeSection(stored(), 'hero', 1).map((s) => s.id).slice(1, 3)).toEqual([
      'gallery',
      'hero',
    ])
  })

  it('gives a retyped box the rule its new type needs, keeping its key', () => {
    const box = retype({ key: 'title', label: 'Heading', type: 'text' }, 'picture')
    expect(box).toMatchObject({ key: 'title', label: 'Heading', type: 'picture' })
    expect('rule' in box).toBe(true)
  })

  it('drops the old value of a retyped box, which the new type cannot read', () => {
    const content = {
      sections: [{ id: 'hero', label: 'Hero', fields: [{ key: 'photo', label: 'Photo', type: 'video' as const, rule: VIDEO }] }],
      values: { hero: { photo: 'blob:old', other: 'kept' } },
    }
    const next = retypeField(content, 'hero', 'photo', 'text')
    expect(next.sections[0]?.fields[0]?.type).toBe('text')
    expect(next.values.hero).toEqual({ other: 'kept' })
  })
})

async function openFields(start: Parameters<typeof recordingSlots>[0] = null) {
  const recorded = recordingSlots(start)
  const user = await mountPanel(recorded.slots)
  await user.click(screen.getByRole('button', { name: 'Fields' }))
  return { ...recorded, user }
}

function sectionCard(id: string): HTMLElement {
  return document.querySelector(`[data-fields-section="${id}"]`) as HTMLElement
}

describe('the Fields page', () => {
  it('offers every kind of box', async () => {
    await openFields()
    const picker = within(sectionCard('hero')).getByLabelText('Kind of new box in Hero')
    expect(within(picker).getAllByRole('option').map((o) => o.textContent)).toEqual(
      FIELD_TYPES.map((t) => t.name),
    )
  })

  it('adds a box that shows in the editor at once, and saves the list through the content code', async () => {
    const { user, content } = await openFields()
    const hero = sectionCard('hero')
    await user.type(within(hero).getByLabelText('New box in Hero'), 'Opening hours')
    await user.selectOptions(within(hero).getByLabelText('Kind of new box in Hero'), 'longText')
    await user.click(within(hero).getByRole('button', { name: /Add box/ }))

    await user.click(screen.getByRole('button', { name: 'Content' }))
    await user.click(screen.getByText('Hero'))
    await user.type(screen.getByLabelText('Opening hours'), 'Nine to five')

    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(content.save).toHaveBeenCalled())
    const sent = lastSaved(content)
    const hours = sent.sections.find((s) => s.id === 'hero')?.fields.at(-1)
    expect(hours).toEqual({ key: 'opening-hours', label: 'Opening hours', type: 'longText' })
    expect(sent.values.hero?.['opening-hours']).toBe('Nine to five')
  })

  it('refuses a box name already used, with a plain message', async () => {
    const { user } = await openFields()
    const hero = sectionCard('hero')
    await user.type(within(hero).getByLabelText('New box in Hero'), 'Heading')
    await user.click(within(hero).getByRole('button', { name: /Add box/ }))
    expect(within(hero).getByText('There is already a box called "Heading" in Hero. Pick another name.')).toBeTruthy()
  })

  it('renames a box and changes its type, and the editor follows', async () => {
    const { user } = await openFields()
    const hero = sectionCard('hero')
    const title = within(hero).getAllByLabelText('Box name')[0] as HTMLInputElement
    await user.clear(title)
    await user.type(title, 'Big words')
    await user.selectOptions(within(hero).getByLabelText('Kind of box for Big words'), 'longText')
    await user.click(screen.getByRole('button', { name: 'Content' }))
    await user.click(screen.getByText('Hero'))
    expect(screen.getByLabelText('Big words').tagName).toBe('TEXTAREA')
  })

  it('asks before removing a box', async () => {
    const { user, content } = await openFields({ sections: [], values: { hero: { intro: 'x' } } })
    await user.click(within(sectionCard('hero')).getByRole('button', { name: 'Remove Intro' }))
    await screen.findByText('Remove Intro?')
    await user.click(screen.getByRole('button', { name: 'Remove' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(content.save).toHaveBeenCalled())
    const sent = lastSaved(content)
    expect(sent.sections.find((s) => s.id === 'hero')?.fields.map((f) => f.key)).not.toContain('intro')
    expect(sent.values.hero?.intro).toBeUndefined()
  })

  it('adds, renames, moves and removes sections', async () => {
    const { user, content } = await openFields()
    await user.type(screen.getByLabelText('New section name'), 'Prices')
    await user.click(screen.getByRole('button', { name: /Add section/ }))
    await user.click(screen.getByRole('button', { name: 'Move Prices up' }))
    const gallery = within(sectionCard('gallery')).getByLabelText('Section name')
    await user.clear(gallery)
    await user.type(gallery, 'Photos')
    await user.click(screen.getByRole('button', { name: 'Remove Film' }))
    await user.click(await screen.findByRole('button', { name: 'Remove' }))

    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(content.save).toHaveBeenCalled())
    const sent = lastSaved(content).sections
    expect(sent.map((s) => s.id)).toEqual(['top', 'hero', 'gallery', 'shop', 'prices', 'contact', 'footer'])
    expect(sent.find((s) => s.id === 'gallery')?.label).toBe('Photos')
  })

  it('will not save a list with a section left without a name', async () => {
    const { user, content } = await openFields()
    await user.clear(within(sectionCard('hero')).getByLabelText('Section name'))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Every section needs a name.')
    expect(content.save).not.toHaveBeenCalled()
  })
})
