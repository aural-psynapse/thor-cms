import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { Content } from '@/panel/field-list'
import { readItems } from '@/panel/lib/values'
import { lastSaved, mountPanel, recordingSlots } from './helpers'

const start: Content = {
  sections: [],
  values: {
    shop: {
      list: {
        collections: [
          { id: 'cups', name: 'Cups' },
          { id: 'bowls', name: 'Bowls' },
        ],
        items: [
          { id: 'tall', name: 'Tall cup', tag: 'STONE', picture: '', collection: 'cups' },
          { id: 'small', name: 'Small cup', tag: 'CLAY', picture: '', collection: 'cups' },
          { id: 'deep', name: 'Deep bowl', tag: 'STONE', picture: '', collection: 'bowls' },
        ],
      },
    },
  },
}

async function openShop() {
  const recorded = recordingSlots(start)
  const user = await mountPanel(recorded.slots)
  await user.click(screen.getByText('Shop'))
  return { ...recorded, user }
}

function folder(id: string): HTMLElement {
  return document.querySelector(`[data-collection="${id}"]`) as HTMLElement
}

async function saved(content: ReturnType<typeof recordingSlots>['content']) {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(content.save).toHaveBeenCalled())
  return readItems(lastSaved(content).values.shop?.list)
}

describe('folders', () => {
  it('shows each folder with its item count', async () => {
    await openShop()
    expect(within(folder('cups')).getByText('2 items')).toBeTruthy()
    expect(within(folder('bowls')).getByText('1 item')).toBeTruthy()
  })

  it('renames a folder', async () => {
    const { user, content } = await openShop()
    const name = within(folder('cups')).getByLabelText('Folder name')
    await user.clear(name)
    await user.type(name, 'Mugs')
    expect((await saved(content)).collections[0]).toEqual({ id: 'cups', name: 'Mugs' })
  })

  it('adds a folder', async () => {
    const { user, content } = await openShop()
    await user.click(screen.getByRole('button', { name: /Add a folder/ }))
    await user.type(screen.getByLabelText('Name of the new folder'), 'Plates{Enter}')
    expect((await saved(content)).collections.map((c) => c.name)).toEqual([
      'Cups',
      'Bowls',
      'Plates',
    ])
  })

  it('asks before deleting a folder, and keeps its items in no folder', async () => {
    const { user, content } = await openShop()
    await user.click(screen.getByRole('button', { name: 'Delete Cups' }))
    await screen.findByText(/Its 2 items are kept/)
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getByText('Not in any folder')).toBeTruthy()
    const value = await saved(content)
    expect(value.collections.map((c) => c.id)).toEqual(['bowls'])
    expect(value.items.filter((i) => i.collection === null)).toHaveLength(2)
  })
})

describe('items', () => {
  it('renames an item and changes its tag', async () => {
    const { user, content } = await openShop()
    await user.click(within(folder('cups')).getByRole('button', { name: 'Open its items' }))
    const tall = document.querySelector('[data-item="tall"]') as HTMLElement
    await user.clear(within(tall).getByLabelText('Name'))
    await user.type(within(tall).getByLabelText('Name'), 'Big cup')
    await user.clear(within(tall).getByLabelText('Tag'))
    await user.type(within(tall).getByLabelText('Tag'), 'NEW')
    const value = await saved(content)
    expect(value.items[0]).toMatchObject({ id: 'tall', name: 'Big cup', tag: 'NEW' })
  })

  it('adds an item to the open folder', async () => {
    const { user, content } = await openShop()
    await user.click(within(folder('bowls')).getByRole('button', { name: 'Open its items' }))
    await user.click(screen.getByRole('button', { name: /Add an item/ }))
    const value = await saved(content)
    expect(value.items.at(-1)).toMatchObject({ name: '', collection: 'bowls' })
  })

  it('asks before removing an item', async () => {
    const { user, content } = await openShop()
    await user.click(within(folder('cups')).getByRole('button', { name: 'Open its items' }))
    await user.click(screen.getByRole('button', { name: 'Remove Small cup' }))
    await user.click(await screen.findByRole('button', { name: 'Keep it' }))
    expect(screen.getByDisplayValue('Small cup')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Remove Small cup' }))
    await user.click(await screen.findByRole('button', { name: 'Remove' }))
    expect(screen.queryByDisplayValue('Small cup')).toBeNull()
    expect((await saved(content)).items.map((i) => i.id)).toEqual(['tall', 'deep'])
  })

  it('moves an item to another folder, and both counts follow', async () => {
    const { user, content } = await openShop()
    await user.click(within(folder('cups')).getByRole('button', { name: 'Open its items' }))
    await user.selectOptions(screen.getByLabelText('Move Tall cup to'), 'bowls')
    expect(screen.queryByDisplayValue('Tall cup')).toBeNull()
    await user.click(screen.getByRole('button', { name: /All folders/ }))
    expect(within(folder('cups')).getByText('1 item')).toBeTruthy()
    expect(within(folder('bowls')).getByText('2 items')).toBeTruthy()
    const value = await saved(content)
    expect(value.items.find((i) => i.id === 'tall')?.collection).toBe('bowls')
  })
})

describe('dragging an item', () => {
  const original = Element.prototype.getBoundingClientRect
  afterEach(() => {
    Element.prototype.getBoundingClientRect = original
  })

  it('reorders it inside its folder', async () => {
    Element.prototype.getBoundingClientRect = function place(this: Element) {
      const card = this.closest('[data-item]')
      if (!card) return DOMRect.fromRect({ x: 0, y: 0, width: 300, height: 1000 })
      const at = [...document.querySelectorAll('[data-item]')].indexOf(card)
      return DOMRect.fromRect({ x: 0, y: at * 300, width: 300, height: 280 })
    }
    const { user, content } = await openShop()
    await user.click(within(folder('cups')).getByRole('button', { name: 'Open its items' }))
    const tall = document.querySelector('[data-item="tall"]') as HTMLElement
    const grip = within(tall).getByRole('button', { name: 'Drag to reorder' })
    grip.focus()
    for (const code of ['Space', 'ArrowDown', 'Space']) {
      await act(async () => {
        fireEvent.keyDown(document.activeElement ?? grip, { code })
        await new Promise((done) => setTimeout(done, 10))
      })
    }
    const value = await saved(content)
    expect(value.items.filter((i) => i.collection === 'cups').map((i) => i.id)).toEqual([
      'small',
      'tall',
    ])
  })
})
