// What a video box will take. A video goes up as it is, nothing is cut, so its
// type, size and shape all have to be ones the site can play.

import { typeProblem } from './picture-rules'

/** What one video box takes. Plain data, so it saves with the field list. */
export type VideoRule = {
  /** The file types the picker offers and the only ones allowed. */
  types: string[]
  /** The biggest file worth taking off a phone or a camera, in megabytes. */
  biggestMb: number
  /** The short side of the picture in the video, in pixels, at least. */
  least: number
}

/** Video files a phone or a camera makes. */
export const VIDEO_TYPES = ['video/mp4', 'video/quicktime']

/**
 * MP4 or MOV, up to 500 MB, 1080 across or more. A phone shoots about 100 MB
 * a minute, so this leaves room for a long one.
 */
export const VIDEO: VideoRule = { types: VIDEO_TYPES, biggestMb: 500, least: 1080 }

// Two sides count as the same shape when they are within this of each other,
// because a video cropped by hand is never exact to the pixel.
const SLACK = 0.03

function sameRatio(a: number, b: number): boolean {
  return Math.abs(a - b) / b <= SLACK
}

/** The two shapes the box takes, in words: "1080×1920 upright or 1920×1080 wide". */
export function saysShapes(rule: VideoRule): string {
  const long = Math.round((rule.least * 16) / 9)
  return `${rule.least}×${long} upright or ${long}×${rule.least} wide`
}

/** What is wrong with the file before it is opened, or nothing. */
export function videoFileProblem(
  file: { type: string; size: number },
  rule: VideoRule,
): string | null {
  if (!file.type.startsWith('video/')) return 'That file is not a video.'
  const wrongType = typeProblem(file.type, rule.types)
  if (wrongType) return wrongType
  if (file.size > rule.biggestMb * 1024 * 1024) {
    return `That video is over ${rule.biggestMb} MB. Make it shorter first.`
  }
  return null
}

/**
 * Is the video upright or wide, and big enough? The answer names the size
 * that was picked and the ones wanted.
 */
export function videoShapeProblem(
  width: number,
  height: number,
  rule: VideoRule,
): string | null {
  const got = `${width}×${height}`
  const upright = height > 0 && sameRatio(width / height, 9 / 16)
  const wide = height > 0 && sameRatio(width / height, 16 / 9)
  if (!upright && !wide) {
    return `Your video is ${got}. This spot takes ${saysShapes(rule)}. Crop it to one of those and pick it again.`
  }
  if (Math.min(width, height) < rule.least) {
    return `Your video is ${got}, too small. This spot takes ${saysShapes(rule)}. Pick a larger one.`
  }
  return null
}

/**
 * Asks the browser how big the picture in the video is. A file the browser
 * cannot open comes back as 0 by 0, which the shape check then refuses.
 */
export function measureVideo(file: Blob): Promise<{ width: number; height: number }> {
  return new Promise((keep) => {
    const player = document.createElement('video')
    const seeAt = URL.createObjectURL(file)
    player.preload = 'metadata'
    player.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(seeAt)
      keep({ width: player.videoWidth, height: player.videoHeight })
    })
    player.addEventListener('error', () => {
      URL.revokeObjectURL(seeAt)
      keep({ width: 0, height: 0 })
    })
    player.src = seeAt
  })
}
