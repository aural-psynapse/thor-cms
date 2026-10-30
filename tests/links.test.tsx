import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BrandIcon, brandColour } from '@/panel/brand-icon'
import type { Content } from '@/panel/field-list'
import { linkProblem } from '@/panel/lib/links'
import { readLinks } from '@/panel/lib/values'
import { dragDown, lastSaved, mountPanel, recordingSlots, testFields } from './helpers'

describe('checking a link', () => {
  it('takes a web address', () => {
    expect(linkProblem('https://instagram.com/someone')).toBeNull()
    expect(linkProblem('http://example.org')).toBeNull()
    expect(linkProblem('  https://example.org/a?b=c  ')).toBeNull()
  })

  it('says how a link starts when it is not one', () => {
    for (const wrong of ['', 'instagram.com/someone', '@someone', 'https://', 'https://no spaces.com']) {
      expect(linkProblem(wrong)).toBe('A link starts with https://')
    }
  })
})

describe('a platform mark', () => {
  it('draws the mark in the platform colour, and black marks in the text colour', () => {
    expect(brandColour('youtube')).toBe('#FF0000')
    expect(brandColour('tiktok')).toBeUndefined()
  })

  it('draws nothing for a platform it does not know', () => {
    const { container } = render(<BrandIcon platform='my-shop' />)
    expect(container.innerHTML).toBe('')
  })
})

const start: Content = {
  sections: [],
  values: {
    contact: {
      links: [
        { id: 'ig', platform: 'instagram', text: '@shop', url: 'https://instagram.com/shop' },
        { id: 'yt', platform: 'youtube', text: 'Shop films', url: 'https://youtube.com/@shop' },
      ],
    },
  },
}

async function openContact(fields = testFields) {
  const recorded = recordingSlots(start)
  const user = await mountPanel(recorded.slots, fields)
  await user.click(screen.getByText('Contact'))
  return { ...recorded, user }
}

async function savedLinks(content: ReturnType<typeof recordingSlots>['content']) {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(content.save).toHaveBeenCalled())
  return readLinks(lastSaved(content).values.contact?.links)
}

describe('the links box', () => {
  it('shows each link with its platform mark', async () => {
    await openContact()
    const ig = document.querySelector('[data-link="ig"]') as HTMLElement
    expect(ig.querySelector('[data-brand="instagram"]')).toBeTruthy()
  })

  it('says so under a link that is not one', async () => {
    const { user } = await openContact()
    const ig = document.querySelector('[data-link="ig"]') as HTMLElement
    const url = within(ig).getByLabelText('Where it goes')
    await user.clear(url)
    await user.type(url, 'instagram.com/shop')
    expect(within(ig).getByText('A link starts with https://')).toBeTruthy()
  })

  it('adds a link', async () => {
    const { user, content } = await openContact()
    await user.click(screen.getByRole('button', { name: /Add a link/ }))
    const links = await savedLinks(content)
    expect(links).toHaveLength(3)
    expect(links[2]).toMatchObject({ platform: 'instagram', text: '', url: '' })
  })

  it('asks before removing a link', async () => {
    const { user, content } = await openContact()
    await user.click(screen.getByRole('button', { name: 'Remove @shop' }))
    await user.click(await screen.findByRole('button', { name: 'Remove' }))
    expect((await savedLinks(content)).map((l) => l.id)).toEqual(['yt'])
  })

  it('reorders links by dragging', async () => {
    const { content } = await openContact()
    await dragDown('data-link', 'ig')
    expect((await savedLinks(content)).map((l) => l.id)).toEqual(['yt', 'ig'])
  })

  it('offers the platforms the field list names', async () => {
    const fields = testFields.map((s) =>
      s.id === 'contact'
        ? {
            ...s,
            fields: [
              {
                key: 'links',
                label: 'Links',
                type: 'links' as const,
                platforms: [
                  { id: 'instagram', label: 'Instagram' },
                  { id: 'shop', label: 'Our shop' },
                ],
              },
            ],
          }
        : s,
    )
    const { user, content } = await openContact(fields)
    const picker = screen.getByLabelText('Where @shop is')
    expect(within(picker).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Instagram',
      'Our shop',
    ])
    await user.selectOptions(picker, 'shop')
    // a platform with no mark of its own shows none
    const ig = document.querySelector('[data-link="ig"]') as HTMLElement
    expect(ig.querySelector('[data-brand]')).toBeNull()
    expect((await savedLinks(content))[0]?.platform).toBe('shop')
  })
})
