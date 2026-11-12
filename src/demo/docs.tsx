import { BarChart3, Type } from 'lucide-react'
import { DocLink, DocsReader } from '@/panel/docs-reader'
import type { DocsGo } from '@/panel/panel'

// Two short guides so the demo shows the help sheet. A real site writes its
// own, with screenshots of its own panel.

export function DemoDocs({ go }: { go: DocsGo }) {
  return (
    <DocsReader
      guides={(show) => [
        {
          id: 'text',
          group: 'Editing',
          title: 'Change a text',
          icon: Type,
          intro: 'Every heading and paragraph on the site has a box in the panel.',
          parts: [
            {
              id: 'find',
              title: 'Find the box',
              body: (
                <ul>
                  <li>
                    Open <DocLink go={go} page='edit' section='welcome'>Welcome</DocLink> on the Content page.
                  </li>
                  <li>Click the box and type. The preview beside it changes as you type.</li>
                </ul>
              ),
            },
            {
              id: 'save',
              title: 'Save',
              body: (
                <p>
                  Click <b>Save</b> at the bottom. A pop-up in the corner says when the change is on the live site. To see
                  who read it, open <button type='button' className='underline' onClick={() => show('numbers')}>Analytics</button>.
                </p>
              ),
            },
          ],
        },
        {
          id: 'numbers',
          group: 'Visitors',
          title: 'Analytics',
          icon: BarChart3,
          intro: 'Visits, where they came from, and what people read.',
          parts: [
            {
              id: 'open',
              title: 'Open it',
              body: (
                <p>
                  Click <DocLink go={go} page='numbers'>Analytics</DocLink> in the left menu.
                </p>
              ),
            },
          ],
        },
      ]}
    />
  )
}
