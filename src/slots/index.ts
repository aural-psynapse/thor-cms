// The four slots this copy of the panel runs on. Here they are all fakes;
// a site swaps each one for its own.

import { sampleContent } from '@/demo/sample'
import { allLinks } from '@/panel/lib/links'
import type { Slots } from '@/panel/slots'
import { fakeContent } from './content'
import { fakeFiles } from './files'
import { fakeNumbers } from './numbers'
import { fakePreview } from './preview'

/** The slots the demo runs on: everything in memory, no keys, no network. */
export const slots: Slots = {
  content: fakeContent(sampleContent),
  files: fakeFiles(),
  // The fake numbers name the demo's own sections, links and videos, so a
  // change to the field list or the sample shows up on the Numbers page.
  numbers: fakeNumbers({
    sections: sampleContent.sections.filter((s) => !s.fixed && s.page !== 'settings').map((s) => s.id),
    links: allLinks(sampleContent).map((l) => l.id),
    videos: sampleContent.sections.flatMap((s) =>
      s.fields.filter((f) => f.type === 'video').map((f) => f.label),
    ),
  }),
  preview: fakePreview(`${import.meta.env.BASE_URL}?preview`),
}
