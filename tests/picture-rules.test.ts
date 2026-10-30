import { describe, expect, it } from 'vitest'
import {
  PORTRAIT,
  SQUARE,
  UPRIGHT_OR_WIDE,
  WIDE,
  pictureRule,
  sizeProblem,
  typeProblem,
  wantedRatio,
} from '@/panel/lib/picture-rules'

describe('the file type', () => {
  it('lets a JPEG through where photos go', () => {
    expect(typeProblem('image/jpeg', PORTRAIT.types)).toBeNull()
  })

  it('turns another format away, and says which are taken', () => {
    expect(typeProblem('image/webp', PORTRAIT.types)).toBe('This spot takes PNG or JPEG files.')
  })

  it('calls a quicktime file a MOV, the way people do', () => {
    expect(typeProblem('video/x-matroska', ['video/mp4', 'video/quicktime'])).toBe(
      'This spot takes MP4 or MOV files.',
    )
  })
})

// A picture is cut to the box's shape before it goes up, and she picks which
// part is kept. So its shape never turns it away; only being too small once
// cut does, and the message names both sizes.
describe('the size of a picture', () => {
  it('takes a wide picture big enough for the box', () => {
    expect(sizeProblem(1280, 720, WIDE)).toBeNull()
    expect(sizeProblem(4032, 3024, WIDE)).toBeNull()
  })

  it('takes an upright photo and cuts a wide piece out of it when there is room', () => {
    expect(sizeProblem(1600, 2400, WIDE)).toBeNull()
  })

  it('turns away a picture too small once cut, naming both sizes', () => {
    expect(sizeProblem(800, 600, WIDE)).toBe(
      'Your picture is 800×600, too small. This spot needs at least 1280×720. Pick a larger one.',
    )
  })

  it('takes a narrow upright crop off a phone where a portrait goes', () => {
    expect(sizeProblem(903, 1500, PORTRAIT)).toBeNull()
    expect(sizeProblem(600, 800, PORTRAIT)).toBe(
      'Your picture is 600×800, too small. This spot needs at least 800×1000. Pick a larger one.',
    )
  })

  it('measures a square box by the square that fits', () => {
    expect(sizeProblem(600, 900, SQUARE)).toBeNull()
    expect(sizeProblem(500, 900, SQUARE)).toMatch(/needs at least 600×600/)
  })

  it('follows the picture in an upright-or-wide box', () => {
    expect(sizeProblem(1080, 1920, UPRIGHT_OR_WIDE)).toBeNull()
    expect(sizeProblem(1920, 1080, UPRIGHT_OR_WIDE)).toBeNull()
    expect(sizeProblem(720, 1280, UPRIGHT_OR_WIDE)).toMatch(/needs at least 1080×1920/)
    expect(sizeProblem(1280, 720, UPRIGHT_OR_WIDE)).toMatch(/needs at least 1920×1080/)
  })

  it('lets a site write its own rule', () => {
    const anyShape = pictureRule({ kind: 'any' }, 500, 300)
    expect(sizeProblem(900, 500, anyShape)).toBeNull()
    expect(sizeProblem(600, 400, anyShape)).toMatch(/600×400, too small.*750×500/)
  })
})

describe('the shape a picture is cut to', () => {
  it('is the box shape, or follows the picture when either goes', () => {
    expect(wantedRatio(SQUARE, 100, 50)).toBe(1)
    expect(wantedRatio(WIDE, 100, 50)).toBe(16 / 9)
    expect(wantedRatio(UPRIGHT_OR_WIDE, 50, 100)).toBe(9 / 16)
    expect(wantedRatio(UPRIGHT_OR_WIDE, 100, 50)).toBe(16 / 9)
    expect(wantedRatio(pictureRule({ kind: 'any' }, 1, 1), 100, 50)).toBeNull()
  })
})
