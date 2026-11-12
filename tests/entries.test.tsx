import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Content, FieldList } from '@/panel/field-list'
import { WIDE } from '@/panel/lib/picture-rules'
import { readEntries } from '@/panel/lib/values'
import { lastSaved, mountPanel, recordingSlots } from './helpers'

const fields: FieldList = [
  { id: 'hero', label: 'Hero', fields: [{ key: 'title', label: 'Heading', type: 'text' }] },
  {
    id: 'producers',
    label: 'Producers',
    fields: [
      {
        key: 'list',
        label: 'Producers',
        type: 'entries',
        one: 'producer',
        titleKey: 'name',
        pictureKey: 'photo',
        fields: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'photo', label: 'Photo', type: 'picture', rule: WIDE },
          {
            key: 'photos',
            label: 'Story photos',
            type: 'entries',
            one: 'photo',
            titleKey: 'caption',
            fields: [{ key: 'caption', label: 'Caption', type: 'text' }],
          },
        ],
      },
    ],
  },
]

const start: Content = {
  sections: [],
  values: {
    producers: {
      list: [
        { id: 'cattier', values: { name: 'Champagne Cattier', photos: [{ id: 'p1', values: { caption: 'Family' } }] } },
        { id: 'bonnet', values: { name: 'Bonnet-Ponson' } },
      ],
    },
  },
}

async function openProducers() {
  const recorded = recordingSlots(start)
  const user = await mountPanel(recorded.slots, fields)
  await user.click(screen.getByText('Producers'))
  await screen.findByText('Champagne Cattier')
  return { user, ...recorded }
}

describe('reading a list of entries', () => {
  it('keeps each entry with its values and gives a missing id one', () => {
    expect(readEntries([{ values: { name: 'A' } }, 'junk', { id: 'b', values: 3 }])).toEqual([
      { id: 'entry-1', values: { name: 'A' } },
      { id: 'b', values: {} },
    ])
    expect(readEntries(undefined)).toEqual([])
  })
})

describe('a list of entries', () => {
  it('lists each entry by its title box', async () => {
    await openProducers()
    expect(screen.getByText('Bonnet-Ponson')).toBeTruthy()
  })

  it('opens an entry, edits its box, and saves it in place', async () => {
    const { user, content } = await openProducers()
    await user.click(screen.getByRole('button', { name: 'Open Bonnet-Ponson' }))
    const name = screen.getByDisplayValue('Bonnet-Ponson')
    await user.clear(name)
    await user.type(name, 'Champagne Bonnet-Ponson')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(content.save).toHaveBeenCalled())
    const list = readEntries(lastSaved(content).values.producers.list)
    expect(list.map((e) => e.values.name)).toEqual(['Champagne Cattier', 'Champagne Bonnet-Ponson'])
  })

  it('opens an entry inside an entry', async () => {
    const { user } = await openProducers()
    await user.click(screen.getByRole('button', { name: 'Open Champagne Cattier' }))
    await user.click(screen.getByRole('button', { name: 'Open Family' }))
    expect(screen.getByDisplayValue('Family')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Back to story photos' }))
    expect(screen.getByRole('button', { name: 'Add a photo' })).toBeTruthy()
  })

  it('adds a new entry and opens it straight away', async () => {
    const { user, content } = await openProducers()
    await user.click(screen.getByRole('button', { name: 'Add a producer' }))
    expect(screen.getByText('New producer')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(content.save).toHaveBeenCalled())
    expect(readEntries(lastSaved(content).values.producers.list)).toHaveLength(3)
  })

  it('asks before it removes an entry', async () => {
    const { user, content } = await openProducers()
    await user.click(screen.getByRole('button', { name: 'Remove Bonnet-Ponson' }))
    const dialog = screen.getByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Remove' }))
    expect(screen.queryByText('Bonnet-Ponson')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(content.save).toHaveBeenCalled())
    expect(readEntries(lastSaved(content).values.producers.list).map((e) => e.id)).toEqual(['cattier'])
  })
})
