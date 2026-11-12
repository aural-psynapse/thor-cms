import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Type } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { DocLink, DocsReader } from '@/panel/docs-reader'
import { Panel } from '@/panel/panel'
import { mountPanel, recordingSlots, testFields } from './helpers'

describe('the Docs button and help sheet', () => {
  it('shows no Docs button when the site gives no docs', async () => {
    const { slots } = recordingSlots()
    await mountPanel(slots)
    expect(screen.queryByRole('button', { name: 'Docs' })).toBeNull()
  })

  it('opens the guides, and a link inside closes them and opens that section', async () => {
    const user = userEvent.setup()
    const { slots } = recordingSlots()
    render(
      <Panel
        fields={testFields}
        slots={slots}
        liveCheck={{ everyMs: 0, giveUpAfter: 3, pause: async () => {} }}
        docs={(go) => (
          <DocsReader
            guides={() => [
              {
                id: 'text',
                group: 'Editing',
                title: 'Change a text',
                icon: Type,
                intro: 'Every heading has a box.',
                parts: [
                  {
                    id: 'find',
                    title: 'Find the box',
                    body: (
                      <p>
                        Open <DocLink go={go} page='edit' section='hero'>the hero</DocLink>.
                      </p>
                    ),
                  },
                ],
              },
            ]}
          />
        )}
      />,
    )
    await screen.findByText('Hero')

    await user.click(screen.getByRole('button', { name: 'Docs' }))
    const sheet = await screen.findByRole('dialog')
    expect(within(sheet).getByRole('heading', { name: 'Change a text' })).toBeTruthy()

    await user.click(within(sheet).getByRole('button', { name: 'the hero' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
