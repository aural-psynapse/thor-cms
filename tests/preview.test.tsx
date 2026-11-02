import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LAPTOP, PHONE, fitScale } from '@/panel/preview-pane'
import type { PreviewUpdate } from '@/panel/slots'
import { mountPanel, recordingSlots } from './helpers'

describe('fitting the screen into the room', () => {
  it('shrinks a phone to fit a short room, the same on both sides', () => {
    const scale = fitScale({ width: 1000, height: 446 }, PHONE)
    expect(scale).toBeCloseTo(0.5)
  })

  it('shrinks a laptop to fit a narrow room', () => {
    expect(fitScale({ width: 744, height: 2000 }, LAPTOP)).toBeCloseTo(0.5)
  })

  it('never blows a screen up past its real size', () => {
    expect(fitScale({ width: 5000, height: 5000 }, PHONE)).toBe(1)
  })
})

function lastPush(push: ReturnType<typeof recordingSlots>['preview']['push']): PreviewUpdate {
  const call = push.mock.calls.at(-1)
  if (!call) throw new Error('nothing was pushed')
  return call[1] as PreviewUpdate
}

describe('the preview beside the boxes', () => {
  it('frames the address the preview code gives, zoomed as one piece', async () => {
    const { slots } = recordingSlots()
    await mountPanel(slots)
    const frame = screen.getByTitle('Your site') as HTMLIFrameElement
    expect(frame.getAttribute('src')).toBe('about:blank')
    const inner = document.querySelector('[data-screen]') as HTMLElement
    expect(inner.style.transform).toBe('')
    expect(inner.style.getPropertyValue('zoom')).toMatch(/^[\d.]+$/)
  })

  it('pushes the unsaved words and the box being edited on every change', async () => {
    const { slots, preview } = recordingSlots()
    const user = await mountPanel(slots)
    await user.click(screen.getByText('Hero'))
    await user.type(screen.getByLabelText('Heading'), 'Hi')
    const sent = lastPush(preview.push)
    expect(sent.content.values.hero?.title).toBe('Hi')
    expect(sent.focus).toEqual({ section: 'hero', field: 'title' })
    const frame = screen.getByTitle('Your site') as HTMLIFrameElement
    expect(preview.push.mock.calls.at(-1)?.[0]).toBe(frame.contentWindow)
  })

  it('jumps to a picture when she clicks it', async () => {
    const { slots, preview } = recordingSlots()
    const user = await mountPanel(slots)
    await user.click(screen.getByText('Hero'))
    await user.click(screen.getByText('Photo'))
    expect(lastPush(preview.push).focus).toEqual({ section: 'hero', field: 'photo' })
  })

  it('pushes again when the page inside says it is listening', async () => {
    const { slots, preview } = recordingSlots()
    await mountPanel(slots)
    const frame = screen.getByTitle('Your site') as HTMLIFrameElement
    const before = preview.push.mock.calls.length
    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', { data: { thorPreview: 'ready' }, source: frame.contentWindow }),
      )
    })
    expect(preview.push.mock.calls.length).toBe(before + 1)
  })

  it('switches between phone and laptop size', async () => {
    const { slots } = recordingSlots()
    const user = await mountPanel(slots)
    expect(screen.getByText('Phone · 390 × 844')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Show it laptop size' }))
    expect(screen.getByText('Laptop · 1440 × 810')).toBeTruthy()
  })

  it('fills the screen, and Escape leaves', async () => {
    const { slots } = recordingSlots()
    const user = await mountPanel(slots)
    await user.click(screen.getByRole('button', { name: 'Full screen' }))
    expect(document.querySelector('[data-preview="full"]')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(document.querySelector('[data-preview="beside"]')).toBeTruthy())
  })
})
