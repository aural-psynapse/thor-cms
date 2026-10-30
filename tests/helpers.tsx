import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import type { Content, FieldList } from '@/panel/field-list'
import { emptyNumbers } from '@/panel/lib/numbers'
import { SQUARE, WIDE } from '@/panel/lib/picture-rules'
import { VIDEO } from '@/panel/lib/video-check'
import { Panel } from '@/panel/panel'
import type { Slots, UploadOptions } from '@/panel/slots'

/** A small site with one of every kind of box. */
export const testFields: FieldList = [
  { id: 'top', label: 'Top bar', fixed: true, fields: [{ key: 'name', label: 'Site name', type: 'text' }] },
  {
    id: 'hero',
    label: 'Hero',
    fields: [
      { key: 'title', label: 'Heading', type: 'text' },
      { key: 'intro', label: 'Intro', type: 'longText' },
      { key: 'photo', label: 'Photo', type: 'picture', rule: WIDE },
      {
        key: 'mood',
        label: 'Mood',
        type: 'custom',
        render: ({ value, onChange, disabled }) => (
          <input
            aria-label='Mood box'
            value={typeof value === 'string' ? value : ''}
            data-disabled={String(disabled)}
            onChange={(event) => onChange(event.target.value)}
          />
        ),
      },
    ],
  },
  { id: 'gallery', label: 'Gallery', fields: [{ key: 'pictures', label: 'Pictures', type: 'pictures', rule: SQUARE }] },
  { id: 'film', label: 'Film', fields: [{ key: 'video', label: 'Video', type: 'video', rule: VIDEO }] },
  { id: 'shop', label: 'Shop', fields: [{ key: 'list', label: 'Products', type: 'items', rule: SQUARE }] },
  { id: 'contact', label: 'Contact', fields: [{ key: 'links', label: 'Links', type: 'links' }] },
  { id: 'footer', label: 'Footer', fixed: true, locked: true, fields: [] },
]

/** Slots that remember every call, with content held in memory. */
export function recordingSlots(start: Content | null = null) {
  let kept = start
  const content = {
    load: vi.fn(async () => kept),
    save: vi.fn(async (next: Content) => {
      kept = next
      return { version: 1 }
    }),
    isLive: vi.fn(async () => true),
  }
  const files = {
    upload: vi.fn(async (_file: Blob, options: UploadOptions): Promise<string> => {
      options.onProgress(0.5)
      return 'https://files.example/picture.webp'
    }),
  }
  const numbers = { load: vi.fn(async () => emptyNumbers()) }
  const preview = { url: 'about:blank', push: vi.fn() }
  const slots: Slots = { content, files, numbers, preview }
  return { slots, content, files, numbers, preview }
}

/** Mounts the whole panel and waits until it has loaded. */
export async function mountPanel(
  slots: Slots,
  fields: FieldList = testFields,
) {
  const user = userEvent.setup()
  render(
    <Panel
      fields={fields}
      slots={slots}
      liveCheck={{ everyMs: 0, giveUpAfter: 3, pause: async () => {} }}
    />,
  )
  await screen.findByText('Hero')
  return user
}

/**
 * Drags the row `id` one place down with the keyboard: grip, Space, the down
 * arrow, Space. jsdom lays nothing out, so each row of `attr` is given a place
 * by its order on the page for the length of the drag.
 */
export async function dragDown(attr: string, id: string): Promise<void> {
  const original = Element.prototype.getBoundingClientRect
  Element.prototype.getBoundingClientRect = function place(this: Element) {
    const row = this.closest(`[${attr}]`)
    // anything around the rows, like the list itself, holds all of them
    if (!row) return DOMRect.fromRect({ x: 0, y: 0, width: 300, height: 5000 })
    const at = [...document.querySelectorAll(`[${attr}]`)].indexOf(row)
    return DOMRect.fromRect({ x: 0, y: at * 300, width: 300, height: 280 })
  }
  try {
    const row = document.querySelector(`[${attr}="${id}"]`) as HTMLElement
    const grip = within(row).getByRole('button', { name: 'Drag to reorder' })
    grip.focus()
    // the drag listens for the arrows a moment after it starts
    for (const code of ['Space', 'ArrowDown', 'Space']) {
      await act(async () => {
        fireEvent.keyDown(document.activeElement ?? grip, { code })
        await new Promise((done) => setTimeout(done, 10))
      })
    }
  } finally {
    Element.prototype.getBoundingClientRect = original
  }
}

/** The content last given to the content code's save. */
export function lastSaved(content: ReturnType<typeof recordingSlots>['content']): Content {
  const call = content.save.mock.calls.at(-1)
  if (!call) throw new Error('save was never called')
  return call[0]
}
