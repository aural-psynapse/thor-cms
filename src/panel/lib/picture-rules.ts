// What each picture box will take. The box says the same thing in words; this
// is the part that stops a wrong file before it is sent, and says in one plain
// line what is wrong with it.

import { cutToShape } from './shrink-picture'

/**
 * The shape a picture box draws its picture at. A picture of another shape is
 * cut to this one, and the owner drags it to choose which part is kept.
 */
export type PictureShape =
  // a fixed shape, as width to height: 1 to 1, 16 to 9, 4 to 5
  | { kind: 'ratio'; wide: number; tall: number }
  // 9 to 16 for an upright picture, 16 to 9 for a wide one, whichever it is
  | { kind: 'upright-or-wide' }
  // kept as it is, nothing cut
  | { kind: 'any' }

/** What one picture box takes. Plain data, so it saves with the field list. */
export type PictureRule = {
  /** The file types the picker offers and the only ones allowed. */
  types: string[]
  shape: PictureShape
  /** The shortest side the kept piece may have, in pixels. */
  smallest: number
  /**
   * How wide the site draws this box on a laptop. The frame the owner drags
   * the picture in is this size, so what she lines up is what visitors get.
   */
  drawnWide: number
}

/** Picture files anyone has on a phone or a laptop. */
export const PHOTO_TYPES = ['image/png', 'image/jpeg']

/** Writes a picture rule. Types default to PNG and JPEG. */
export function pictureRule(
  shape: PictureShape,
  smallest: number,
  drawnWide: number,
  types: string[] = PHOTO_TYPES,
): PictureRule {
  return { types, shape, smallest, drawnWide }
}

/** As tall as it is wide: a logo, a face, a product shot. */
export const SQUARE = pictureRule({ kind: 'ratio', wide: 1, tall: 1 }, 600, 320)
/** 16 to 9: a banner, the picture behind a heading. */
export const WIDE = pictureRule({ kind: 'ratio', wide: 16, tall: 9 }, 720, 480)
/** 4 to 5, taller than wide: a person standing. */
export const PORTRAIT = pictureRule({ kind: 'ratio', wide: 4, tall: 5 }, 800, 400)
/** The two video shapes, 9 to 16 or 16 to 9, whichever the picture is closer to. */
export const UPRIGHT_OR_WIDE = pictureRule({ kind: 'upright-or-wide' }, 1080, 320)

/** The shipped rules by name, for the Fields page. */
export const PICTURE_RULES: Record<string, PictureRule> = {
  square: SQUARE,
  wide: WIDE,
  portrait: PORTRAIT,
  'upright-or-wide': UPRIGHT_OR_WIDE,
}

/** "PNG or JPEG", the way a person names file types. */
export function saysType(types: string[]): string {
  const names = types.map((t) => (t.split('/')[1] ?? t).toUpperCase())
  // quicktime is what a browser calls a MOV file
  return names.map((n) => (n === 'QUICKTIME' ? 'MOV' : n)).join(' or ')
}

/** Is this file one of the types the box takes? The answer is the line shown. */
export function typeProblem(type: string, types: string[]): string | null {
  if (types.includes(type)) return null
  return `This spot takes ${saysType(types)} files.`
}

/**
 * The shape the box draws the picture at, as width over height, or null when
 * any shape goes. An upright-or-wide box follows the picture she picked.
 */
export function wantedRatio(
  rule: PictureRule,
  width: number,
  height: number,
): number | null {
  const shape = rule.shape
  if (shape.kind === 'ratio') return shape.wide / shape.tall
  if (shape.kind === 'upright-or-wide') return width > height ? 16 / 9 : 9 / 16
  return null
}

/** The smallest picture this box takes, in the shape it would be cut to. */
export function wantedSize(
  rule: PictureRule,
  width: number,
  height: number,
): { width: number; height: number } {
  const ratio = wantedRatio(rule, width, height) ?? width / Math.max(height, 1)
  const least = rule.smallest
  return ratio >= 1
    ? { width: Math.round(least * ratio), height: least }
    : { width: least, height: Math.round(least / ratio) }
}

/**
 * Is the picture big enough once it is cut to the box's shape? The answer
 * names the size that was picked and the one wanted, so she knows what to do.
 */
export function sizeProblem(
  width: number,
  height: number,
  rule: PictureRule,
): string | null {
  const ratio = wantedRatio(rule, width, height)
  const keep = ratio ? cutToShape(width, height, ratio) : { width, height }
  if (Math.min(keep.width, keep.height) >= rule.smallest) return null
  const want = wantedSize(rule, width, height)
  return `Your picture is ${width}×${height}, too small. This spot needs at least ${want.width}×${want.height}. Pick a larger one.`
}
