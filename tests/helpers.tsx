import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import type { Content, FieldList } from '@/panel/field-list'
import { emptyNumbers } from '@/panel/lib/numbers'
import { SQUARE, WIDE } from '@/panel/lib/picture-rules'
import { VIDEO } from '@/panel/lib/video-check'
import { Panel } from '@/panel/panel'
import type { Slots } from '@/panel/slots'

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
    upload: vi.fn(async (_file: Blob, options: { onProgress: (n: number) => void }) => {
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

/** The content last given to the content code's save. */
export function lastSaved(content: ReturnType<typeof recordingSlots>['content']): Content {
  const call = content.save.mock.calls.at(-1)
  if (!call) throw new Error('save was never called')
  return call[0]
}
