import { describe, expect, it } from 'vitest'
import { BIGGEST, MIDDLE, cutToShape, fitInside } from '@/panel/lib/shrink-picture'

describe('shrinking a picture to fit', () => {
  it('leaves a picture that is already small enough alone', () => {
    expect(fitInside(1200, 800)).toEqual({ width: 1200, height: 800 })
  })

  it('cuts a phone photo down to the longest side a site shows', () => {
    expect(fitInside(4032, 3024)).toEqual({ width: BIGGEST, height: 1500 })
  })

  it('does the same for an upright photo', () => {
    expect(fitInside(3024, 4032)).toEqual({ width: 1500, height: BIGGEST })
  })

  it('keeps the shape of a very wide one, and never returns nothing', () => {
    expect(fitInside(6000, 1000)).toEqual({ width: BIGGEST, height: 333 })
    expect(fitInside(6000, 2)).toEqual({ width: BIGGEST, height: 1 })
  })
})

describe('cutting a picture to the shape of its box', () => {
  it('leaves a picture that is already the right shape alone', () => {
    expect(cutToShape(1200, 1500, 0.8)).toEqual({ x: 0, y: 0, width: 1200, height: 1500 })
  })

  it('takes the sides off one that is too wide', () => {
    expect(cutToShape(1600, 1200, 0.8)).toEqual({ x: 320, y: 0, width: 960, height: 1200 })
  })

  it('takes the top and bottom off one that is too tall', () => {
    expect(cutToShape(903, 1500, 0.8)).toEqual({ x: 0, y: 186, width: 903, height: 1129 })
  })

  it('slides the piece to where she dragged it', () => {
    const top = cutToShape(903, 1500, 0.8, { wide: 0.5, tall: 0 })
    const bottom = cutToShape(903, 1500, 0.8, { wide: 0.5, tall: 1 })
    expect(top.y).toBe(0)
    expect(bottom.y).toBe(1500 - 1129)
    expect(top.height).toBe(bottom.height)
  })

  it('never takes a piece that starts outside the picture', () => {
    const past = cutToShape(903, 1500, 0.8, { wide: 9, tall: -4 })
    expect(past.x).toBe(0)
    expect(past.y).toBe(0)
  })

  it('keeps the piece the shape the box asked for', () => {
    for (const [w, h, ratio] of [
      [4000, 3000, 1],
      [903, 1500, 16 / 9],
      [1200, 1600, 1200 / 630],
    ] as const) {
      const keep = cutToShape(w, h, ratio, MIDDLE)
      expect(Math.abs(keep.width / keep.height - ratio)).toBeLessThan(0.01)
      expect(keep.width).toBeLessThanOrEqual(w)
      expect(keep.height).toBeLessThanOrEqual(h)
    }
  })
})
