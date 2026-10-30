// The four slots this copy of the panel runs on. Here they are all fakes;
// a site swaps each one for its own.

import { sampleContent } from '@/demo/sample'
import type { Slots } from '@/panel/slots'
import { fakeContent } from './content'
import { fakeFiles } from './files'
import { fakeNumbers } from './numbers'
import { fakePreview } from './preview'

/** The slots the demo runs on: everything in memory, no keys, no network. */
export const slots: Slots = {
  content: fakeContent(sampleContent),
  files: fakeFiles(),
  numbers: fakeNumbers({
    sections: ['welcome', 'gallery', 'products', 'contact'],
    links: ['instagram', 'youtube'],
    videos: ['Studio tour'],
  }),
  preview: fakePreview(`${import.meta.env.BASE_URL}?preview`),
}
