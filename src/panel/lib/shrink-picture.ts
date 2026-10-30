// Shrinking a photo in the owner's browser before it goes anywhere. A photo
// straight off a phone is several thousand pixels wide and several megabytes;
// a site never shows one larger than this, so her own browser does the work
// and the upload takes seconds instead of minutes.

import { WORDS } from '../words'

/** The longest side a picture on a site ever needs. */
export const BIGGEST = 2000
/** How hard webp squeezes: high enough that nobody sees the difference. */
export const QUALITY = 0.82

/** A width and a height in pixels. */
export type Size = { width: number; height: number }

/**
 * The size a picture becomes: the same shape, with its longest side cut down
 * to `biggest`. A picture already smaller than that is left alone.
 */
export function fitInside(
  width: number,
  height: number,
  biggest: number = BIGGEST,
): Size {
  const longest = Math.max(width, height)
  if (longest <= biggest || longest === 0) {
    return { width: Math.round(width), height: Math.round(height) }
  }
  const by = biggest / longest
  return {
    width: Math.max(1, Math.round(width * by)),
    height: Math.max(1, Math.round(height * by)),
  }
}

/**
 * Which part of a picture to keep when it is cut to the shape of its box.
 * 0 is the top or the left edge, 1 the bottom or the right, 0.5 the middle.
 * She sets it by dragging the picture before it goes up.
 */
export type Framing = { wide: number; tall: number }

/** The middle of the picture, where the kept piece sits until she drags it. */
export const MIDDLE: Framing = { wide: 0.5, tall: 0.5 }

/** The piece of a picture that is kept, in the picture's own pixels. */
export type Piece = { x: number; y: number; width: number; height: number }

/**
 * The biggest piece of this picture that has the shape the box wants, and
 * where that piece sits once she has dragged it. A picture already the right
 * shape keeps all of itself and the dragging changes nothing.
 */
export function cutToShape(
  width: number,
  height: number,
  wantRatio: number,
  at: Framing = MIDDLE,
): Piece {
  const have = width / height
  let keepW = width
  let keepH = height
  if (have > wantRatio) {
    // too wide for the box: some of the sides goes
    keepW = Math.round(height * wantRatio)
  } else if (have < wantRatio) {
    // too tall: some of the top and bottom goes
    keepH = Math.round(width / wantRatio)
  }
  const room = (n: number, of: number, part: number) =>
    Math.round(Math.max(0, of - n) * Math.min(1, Math.max(0, part)))
  return {
    x: room(keepW, width, at.wide),
    y: room(keepH, height, at.tall),
    width: keepW,
    height: keepH,
  }
}

/** A picture after shrinking: the webp file and its size. */
export type Shrunk = { body: Blob; width: number; height: number }

/** How wide and tall a picture is, or null when the browser cannot read it. */
export async function measurePicture(file: Blob): Promise<Size | null> {
  try {
    const picture = await createImageBitmap(file)
    const size = { width: picture.width, height: picture.height }
    picture.close()
    return size
  } catch {
    return null
  }
}

/**
 * Cuts the picture to the box's shape at the place she chose, shrinks it, and
 * writes it as webp, which is a third the size of a phone photo at the same
 * quality and is read by every current browser. With no ratio the picture
 * keeps its own shape.
 */
export async function shrinkPicture(
  file: Blob,
  wantRatio: number | null,
  at: Framing = MIDDLE,
): Promise<Shrunk> {
  const picture = await createImageBitmap(file)
  const keep = wantRatio
    ? cutToShape(picture.width, picture.height, wantRatio, at)
    : { x: 0, y: 0, width: picture.width, height: picture.height }
  const size = fitInside(keep.width, keep.height)

  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const paint = canvas.getContext('2d')
  if (!paint) throw new Error(WORDS.picture.cannotShrink)
  // Only the kept piece is drawn. It and the canvas have the same shape, so
  // this scales and never squashes.
  paint.drawImage(
    picture,
    keep.x,
    keep.y,
    keep.width,
    keep.height,
    0,
    0,
    size.width,
    size.height,
  )
  picture.close()

  const body = await new Promise<Blob | null>((done) =>
    canvas.toBlob(done, 'image/webp', QUALITY),
  )
  if (!body) throw new Error(WORDS.picture.unreadable)
  return { body, width: size.width, height: size.height }
}
