import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VIDEO, videoFileProblem, videoShapeProblem } from '@/panel/lib/video-check'
import { lastSaved, mountPanel, recordingSlots } from './helpers'

// jsdom cannot open a video, so measuring one stands in for the browser.
const browser = vi.hoisted(() => ({ size: { width: 1080, height: 1920 } }))
vi.mock('@/panel/lib/video-check', async (real) => ({
  ...(await real<typeof import('@/panel/lib/video-check')>()),
  measureVideo: vi.fn(async () => browser.size),
}))

beforeEach(() => {
  browser.size = { width: 1080, height: 1920 }
})

function pick(file: File) {
  const chooser = screen.getByTestId('file-Video') as HTMLInputElement
  Object.defineProperty(chooser, 'files', { value: [file], configurable: true })
  fireEvent.change(chooser)
}

const film = (type = 'video/mp4', size = 10) => {
  const file = new File(['x'], 'tour.mp4', { type })
  Object.defineProperty(file, 'size', { value: size * 1024 * 1024 })
  return file
}

describe('checking a video file', () => {
  it('takes MP4 and MOV, and names them when it turns another away', () => {
    expect(videoFileProblem(film('video/quicktime'), VIDEO)).toBeNull()
    expect(videoFileProblem(film('video/x-matroska'), VIDEO)).toBe(
      'This spot takes MP4 or MOV files.',
    )
    expect(videoFileProblem(film('image/png'), VIDEO)).toBe('That file is not a video.')
  })

  it('turns away a file over the size limit', () => {
    expect(videoFileProblem(film('video/mp4', 501), VIDEO)).toBe(
      'That video is over 500 MB. Make it shorter first.',
    )
  })

  it('holds a video to the two shapes and a smallest size', () => {
    expect(videoShapeProblem(1080, 1920, VIDEO)).toBeNull()
    expect(videoShapeProblem(3840, 2160, VIDEO)).toBeNull()
    expect(videoShapeProblem(1080, 1080, VIDEO)).toBe(
      'Your video is 1080×1080. This spot takes 1080×1920 upright or 1920×1080 wide. Crop it to one of those and pick it again.',
    )
    expect(videoShapeProblem(540, 960, VIDEO)).toBe(
      'Your video is 540×960, too small. This spot takes 1080×1920 upright or 1920×1080 wide. Pick a larger one.',
    )
  })
})

describe('the video box in the panel', () => {
  it('shows what it takes while empty, with Upload in grey', async () => {
    const { slots } = recordingSlots()
    const user = await mountPanel(slots)
    await user.click(screen.getByText('Film'))
    expect(screen.getByText(/MP4 or MOV, up to 500 MB/)).toBeTruthy()
    const upload = screen.getByRole('button', { name: 'Upload video' })
    expect(upload.className).not.toContain('bg-destructive')
  })

  it('says a video is there, with Replace in red', async () => {
    const { slots } = recordingSlots({
      sections: [],
      values: { film: { video: 'https://files.example/tour.mp4' } },
    })
    const user = await mountPanel(slots)
    await user.click(screen.getByText('Film'))
    expect(screen.getByText('A video is on this box. Replace swaps it.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Replace video' }).className).toContain(
      'bg-destructive',
    )
  })

  it('puts the reason for a refused shape on the box, and sends nothing', async () => {
    browser.size = { width: 1080, height: 1080 }
    const { slots, files } = recordingSlots()
    const user = await mountPanel(slots)
    await user.click(screen.getByText('Film'))
    pick(film())
    const reason = await screen.findByText(/Your video is 1080×1080/)
    expect(reason.className).toContain('text-destructive')
    expect(screen.queryByText(/up to 500 MB/)).toBeNull()
    expect(files.upload).not.toHaveBeenCalled()
  })

  it('puts the reason for a refused type or size on the box', async () => {
    const { slots } = recordingSlots()
    const user = await mountPanel(slots)
    await user.click(screen.getByText('Film'))
    pick(film('video/webm'))
    await screen.findByText('This spot takes MP4 or MOV files.')
    pick(film('video/mp4', 900))
    await screen.findByText('That video is over 500 MB. Make it shorter first.')
  })

  it('holds a good file until Save, then sends it with progress and saves its address', async () => {
    const { slots, files, content } = recordingSlots()
    let finish: (url: string) => void = () => {}
    files.upload.mockImplementation((_blob, options) => {
      options.onProgress(0.5)
      return new Promise<string>((done) => (finish = done))
    })
    const user = await mountPanel(slots)
    await user.click(screen.getByText('Film'))
    pick(film())
    await screen.findByText('tour.mp4, goes up when you save')
    expect(files.upload).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Sending the video, 50%')
    const [sent, options] = files.upload.mock.calls[0] ?? []
    expect((sent as File).name).toBe('tour.mp4')
    expect(options?.kind).toBe('video')
    expect(content.save).not.toHaveBeenCalled()

    await act(async () => finish('https://files.example/tour.mp4'))
    await waitFor(() => expect(content.save).toHaveBeenCalled())
    expect(lastSaved(content).values.film?.video).toBe('https://files.example/tour.mp4')
    const box = document.querySelector('[data-video="Video"]') as HTMLElement
    await within(box).findByText('A video is on this box. Replace swaps it.')
  })
})
