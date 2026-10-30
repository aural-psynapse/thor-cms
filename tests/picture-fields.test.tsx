import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { lastSaved, mountPanel, recordingSlots } from './helpers'

// jsdom cannot open or paint a picture, so measuring and shrinking stand in
// for the browser. Everything else runs as it does for the owner.
const browser = vi.hoisted(() => ({
  size: { width: 1600, height: 900 } as { width: number; height: number } | null,
}))
vi.mock('@/panel/lib/shrink-picture', async (real) => ({
  ...(await real<typeof import('@/panel/lib/shrink-picture')>()),
  measurePicture: vi.fn(async () => browser.size),
  shrinkPicture: vi.fn(async () => ({
    body: new Blob(['small'], { type: 'image/webp' }),
    width: 1280,
    height: 720,
  })),
}))

beforeEach(() => {
  browser.size = { width: 1600, height: 900 }
})

function pick(label: string, file: File) {
  const chooser = screen.getByTestId(`file-${label}`) as HTMLInputElement
  Object.defineProperty(chooser, 'files', { value: [file], configurable: true })
  fireEvent.change(chooser)
}

const photo = () => new File(['x'], 'photo.jpg', { type: 'image/jpeg' })

describe('a picture box', () => {
  it('shrinks the picture, sends it to the files code, and puts its address in the content', async () => {
    const { slots, files, content } = recordingSlots()
    let finish: (url: string) => void = () => {}
    files.upload.mockImplementation((_blob, options) => {
      options.onProgress(0.4)
      return new Promise<string>((done) => (finish = done))
    })
    const user = await mountPanel(slots)
    await user.click(screen.getByText('Hero'))
    pick('Photo', photo())

    await user.click(await screen.findByRole('button', { name: /Use this/ }))
    // progress from the files code reaches the bar on the box
    await screen.findByText('Sending, 40%')
    expect(screen.getByRole('progressbar')).toBeTruthy()
    const [sent, options] = files.upload.mock.calls[0] ?? []
    expect((sent as Blob).type).toBe('image/webp')
    expect(options?.kind).toBe('picture')

    await act(async () => finish('https://files.example/new.webp'))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(content.save).toHaveBeenCalled())
    expect(lastSaved(content).values.hero?.photo).toBe('https://files.example/new.webp')
  })

  it('turns away the wrong type in one sentence, turns red, and never calls the files code', async () => {
    const { slots, files } = recordingSlots()
    const user = await mountPanel(slots)
    await user.click(screen.getByText('Hero'))
    pick('Photo', new File(['x'], 'shot.gif', { type: 'image/gif' }))
    const said = await screen.findByText('This spot takes PNG or JPEG files.')
    expect(said.className).toContain('text-destructive')
    const box = document.querySelector('[data-media="Photo"]') as HTMLElement
    expect(box.className).toContain('border-destructive')
    expect(files.upload).not.toHaveBeenCalled()
  })

  it('turns away a picture too small, naming the picked size and the wanted one', async () => {
    browser.size = { width: 800, height: 600 }
    const { slots, files } = recordingSlots()
    const user = await mountPanel(slots)
    await user.click(screen.getByText('Hero'))
    pick('Photo', photo())
    await screen.findByText(
      'Your picture is 800×600, too small. This spot needs at least 1280×720. Pick a larger one.',
    )
    expect(files.upload).not.toHaveBeenCalled()
  })

  it('clears the red line when she picks another file', async () => {
    const { slots } = recordingSlots()
    const user = await mountPanel(slots)
    await user.click(screen.getByText('Hero'))
    pick('Photo', new File(['x'], 'shot.gif', { type: 'image/gif' }))
    await screen.findByText(/This spot takes/)
    pick('Photo', photo())
    await screen.findByRole('button', { name: /Use this/ })
    expect(screen.queryByText(/This spot takes/)).toBeNull()
  })

  it('clears the red line when she leaves the section', async () => {
    const { slots } = recordingSlots()
    const user = await mountPanel(slots)
    await user.click(screen.getByText('Hero'))
    pick('Photo', new File(['x'], 'shot.gif', { type: 'image/gif' }))
    await screen.findByText(/This spot takes/)
    await user.click(screen.getByRole('button', { name: /All sections/ }))
    await user.click(screen.getByText('Hero'))
    expect(screen.queryByText(/This spot takes/)).toBeNull()
  })

  it('shows the picture, or an icon when it is empty or will not load', async () => {
    const { slots } = recordingSlots({
      sections: [],
      values: { hero: { photo: 'https://files.example/old.webp' } },
    })
    const user = await mountPanel(slots)
    await user.click(screen.getByText('Hero'))
    const box = document.querySelector('[data-media="Photo"]') as HTMLElement
    const img = box.querySelector('img') as HTMLImageElement
    expect(img.src).toBe('https://files.example/old.webp')
    // a filled box offers Replace, in red
    expect(within(box).getByRole('button', { name: 'Replace photo' }).className).toContain(
      'bg-destructive',
    )
    fireEvent.error(img)
    expect(box.querySelector('[data-thumb="icon"]')).toBeTruthy()
  })
})

describe('a row of pictures', () => {
  it('adds a picture box, and asks before removing one', async () => {
    const { slots, content } = recordingSlots({
      sections: [],
      values: { gallery: { pictures: ['https://files.example/a.webp'] } },
    })
    const user = await mountPanel(slots)
    await user.click(screen.getByText('Gallery'))
    await user.click(screen.getByRole('button', { name: /Add a picture/ }))
    expect(screen.getByText('Picture 2')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Remove picture 1' }))
    await user.click(await screen.findByRole('button', { name: 'Remove' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(content.save).toHaveBeenCalled())
    expect(lastSaved(content).values.gallery?.pictures).toEqual([''])
  })
})
