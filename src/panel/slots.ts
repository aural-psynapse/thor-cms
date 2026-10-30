// The four pieces the panel needs from the site it runs on. The panel never
// fetches, stores or uploads by itself: it calls these, and each site writes
// its own. This repo ships in-memory fakes of all four in src/slots/.

import type { Content } from './field-list'
import type { Numbers } from './lib/numbers'

/** Loads and saves the whole content, and says when a save is on the live site. */
export type ContentSlot = {
  /** The saved content, or null when nothing has been saved yet. */
  load: () => Promise<Content | null>
  /** Saves the whole content. The version is what `isLive` is later asked about. */
  save: (content: Content) => Promise<{ version: number }>
  /** True once the live site shows this saved version or a later one. */
  isLive: (version: number) => Promise<boolean>
}

/** What a file is, so the files code can put it in the right place. */
export type UploadKind = 'picture' | 'video'

/** The details that go with a file to the files code. */
export type UploadOptions = {
  /** The file name she picked, for the files code to keep or ignore. */
  name: string
  kind: UploadKind
  /** Called with 0 to 1 as the file goes up. */
  onProgress: (fraction: number) => void
}

/** Stores a picture or video and says where it can be read from. */
export type FilesSlot = {
  /** Sends the file and returns the address it can be read from. */
  upload: (file: Blob, options: UploadOptions) => Promise<string>
}

/** Fetches the numbers for the Numbers page. */
export type NumbersSlot = {
  /** Everything for the last `days` days: 7, 30 or 90. */
  load: (days: number) => Promise<Numbers>
}

/** The box being worked on, so the preview can scroll to it. */
export type PreviewFocus = { section: string; field: string | null }

/** What the preview is sent on every change. */
export type PreviewUpdate = { content: Content; focus: PreviewFocus | null }

/**
 * Shows the site beside the boxes. The panel frames `url` and calls `push`
 * on every change, when the frame loads, and whenever the page inside posts
 * `{ thorPreview: 'ready' }` to say it is listening.
 */
export type PreviewSlot = {
  url: string
  push: (frame: Window, update: PreviewUpdate) => void
}

/** All four, as the panel takes them. */
export type Slots = {
  content: ContentSlot
  files: FilesSlot
  numbers: NumbersSlot
  preview: PreviewSlot
}
