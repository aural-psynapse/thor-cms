import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { Panel } from '@/panel/panel'
import { describe, expect, it, vi } from 'vitest'
import { dragDown, lastSaved, mountPanel, recordingSlots, testFields } from './helpers'

function sectionNames(): string[] {
  return [...document.querySelectorAll('[data-section]')].map(
    (el) => el.getAttribute('data-section') ?? '',
  )
}

describe('the panel drawn from a field list', () => {
  it('lists every section from the field list, in page order', async () => {
    const { slots } = recordingSlots()
    await mountPanel(slots)
    expect(sectionNames()).toEqual(testFields.map((s) => s.id))
  })

  it('draws a different site from a different list, with nothing hard-coded', async () => {
    const { slots } = recordingSlots()
    await mountPanel(slots, [
      { id: 'hero', label: 'Hero', fields: [] },
      { id: 'menu', label: 'Menu of the day', fields: [] },
    ])
    expect(screen.getByText('Menu of the day')).toBeTruthy()
    expect(sectionNames()).toEqual(['hero', 'menu'])
  })

  it('shows only the pages the site asks for', async () => {
    const { slots, numbers } = recordingSlots()
    await mountPanel(slots, testFields, ['edit'])
    expect(screen.getByRole('button', { name: 'Content' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Analytics' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Fields' })).toBeNull()
    expect(numbers.load).not.toHaveBeenCalled()
  })

  it('moves settings sections out of the edit list onto the Settings page', async () => {
    const { slots, content } = recordingSlots({
      sections: [],
      values: { seo: { title: 'Old title' } },
    })
    const user = await mountPanel(slots, [
      ...testFields,
      {
        id: 'seo',
        label: 'Search results',
        page: 'settings',
        fields: [{ key: 'title', label: 'Tab title', type: 'text' }],
      },
    ])
    expect(screen.queryByText('Search results')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    const box = screen.getByLabelText('Tab title') as HTMLInputElement
    expect(box.value).toBe('Old title')
    await user.clear(box)
    await user.type(box, 'New title')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(content.save).toHaveBeenCalled())
    expect(lastSaved(content).values.seo?.title).toBe('New title')
  })

  it('leaves the Settings page out when no section belongs there', async () => {
    const { slots } = recordingSlots()
    await mountPanel(slots)
    expect(screen.queryByRole('button', { name: 'Settings' })).toBeNull()
  })

  it('opens the first page it shows when the edit page is left out', async () => {
    const { slots } = recordingSlots()
    render(<Panel fields={testFields} slots={slots} pages={['fields']} />)
    expect(await screen.findByRole('heading', { name: 'Fields' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Content' })).toBeNull()
  })

  it('holds fixed sections in place, with no grip and no switch', async () => {
    const { slots } = recordingSlots()
    await mountPanel(slots)
    const top = document.querySelector('[data-section="top"]') as HTMLElement
    expect(within(top).queryByRole('button', { name: 'Drag to reorder' })).toBeNull()
    expect(within(top).queryByRole('switch')).toBeNull()
    expect(within(top).getByText('always on')).toBeTruthy()
  })

  it('switching a section off marks it and saves it as hidden', async () => {
    const { slots, content } = recordingSlots()
    const user = await mountPanel(slots)
    await user.click(screen.getByRole('switch', { name: 'Hide Gallery from the site' }))
    expect(screen.getByText('not on the site')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(content.save).toHaveBeenCalledTimes(1))
    const gallery = lastSaved(content).sections.find((s) => s.id === 'gallery')
    expect(gallery?.hidden).toBe(true)
  })
})

describe('dragging a section', () => {
  it('moves it down the page with the keyboard, and saves the new order', async () => {
    const { slots, content } = recordingSlots()
    await mountPanel(slots)
    await dragDown('data-section', 'hero')
    expect(sectionNames().slice(0, 3)).toEqual(['top', 'gallery', 'hero'])

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(content.save).toHaveBeenCalled())
    expect(lastSaved(content).sections.map((s) => s.id).slice(0, 3)).toEqual([
      'top',
      'gallery',
      'hero',
    ])
  })
})

describe('editing and saving', () => {
  it('shows no save bar until something changes', async () => {
    const { slots } = recordingSlots()
    await mountPanel(slots)
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
  })

  it('sends the whole new content to the content code on Save, then says when it is live', async () => {
    const { slots, content } = recordingSlots()
    const user = await mountPanel(slots)
    await user.click(screen.getByText('Hero'))
    await user.type(screen.getByLabelText('Heading'), 'Hello')
    await user.type(screen.getByLabelText('Intro'), 'A longer line')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await screen.findByText('Your change is on the live site.')
    const sent = lastSaved(content)
    expect(sent.values.hero).toMatchObject({ title: 'Hello', intro: 'A longer line' })
    // the whole content goes, field list included
    expect(sent.sections.map((s) => s.id)).toEqual(testFields.map((s) => s.id))
    expect(content.isLive).toHaveBeenCalledWith(1)
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
  })

  it('says so when the live site never catches up', async () => {
    const { slots, content } = recordingSlots()
    content.isLive.mockResolvedValue(false)
    const user = await mountPanel(slots)
    await user.click(screen.getByText('Hero'))
    await user.type(screen.getByLabelText('Heading'), 'Hi')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText(/taking longer than usual/)
    expect(content.isLive).toHaveBeenCalledTimes(3)
  })

  it('Discard changes asks first, then puts everything back', async () => {
    const { slots, content } = recordingSlots({
      sections: [],
      values: { hero: { title: 'Before' } },
    })
    const user = await mountPanel(slots)
    await user.click(screen.getByText('Hero'))
    const box = screen.getByLabelText('Heading') as HTMLInputElement
    expect(box.value).toBe('Before')
    await user.clear(box)
    await user.type(box, 'After')
    await user.click(screen.getByRole('button', { name: 'Discard changes' }))
    await user.click(await screen.findByRole('button', { name: 'Discard' }))
    expect((screen.getByLabelText('Heading') as HTMLInputElement).value).toBe('Before')
    expect(content.save).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
  })

  it('gives a custom box its value, its onChange, and disabled while saving', async () => {
    const { slots, content } = recordingSlots({ sections: [], values: { hero: { mood: 'calm' } } })
    let finish: (v: { version: number }) => void = () => {}
    content.save.mockImplementation(
      () => new Promise<{ version: number }>((done) => (finish = done)),
    )
    const user = await mountPanel(slots)
    await user.click(screen.getByText('Hero'))
    const mood = screen.getByLabelText('Mood box') as HTMLInputElement
    expect(mood.value).toBe('calm')
    expect(mood.dataset.disabled).toBe('false')
    await user.type(mood, 'er')
    expect(mood.value).toBe('calmer')

    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(mood.dataset.disabled).toBe('true'))
    await act(async () => finish({ version: 1 }))
    await waitFor(() => expect(mood.dataset.disabled).toBe('false'))
    expect(lastSaved(content).values.hero?.mood).toBe('calmer')
  })

  it('says plainly when the content cannot be loaded', async () => {
    const { slots, content } = recordingSlots()
    content.load.mockRejectedValue(new Error('offline'))
    const { render } = await import('@testing-library/react')
    const { Panel } = await import('@/panel/panel')
    render(<Panel fields={testFields} slots={slots} />)
    await screen.findByText(/could not be loaded/)
    vi.restoreAllMocks()
  })
})
