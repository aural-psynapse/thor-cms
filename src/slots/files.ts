// FAKE. Replace this file per site: send the picture or video wherever the
// site keeps files, report progress as it goes, and return its address.

import type { FilesSlot } from '@/panel/slots'

/**
 * Pretends to send the file in five steps, then hands back an address on the
 * owner's own computer, which the preview can show straight away.
 */
export function fakeFiles(stepMs = 120): FilesSlot {
  return {
    upload: async (file, { onProgress }) => {
      for (let step = 1; step <= 5; step++) {
        await new Promise((done) => setTimeout(done, stepMs))
        onProgress(step / 5)
      }
      return URL.createObjectURL(file)
    },
  }
}
