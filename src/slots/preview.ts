// FAKE. Replace this file per site: give the address of a page on the site
// that can draw unsaved content, and send it the content and the box being
// edited in whatever way that page listens.

import type { PreviewSlot } from '@/panel/slots'

/** The message the demo preview page listens for. */
export const PREVIEW_MESSAGE = 'thor-preview-update'

/**
 * Frames the demo preview page inside this app and posts each update to it.
 * Only pages on the same address are told anything.
 */
export function fakePreview(url: string): PreviewSlot {
  return {
    url,
    push: (frame, update) => {
      frame.postMessage({ kind: PREVIEW_MESSAGE, update }, window.location.origin)
    },
  }
}
