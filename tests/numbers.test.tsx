import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Content } from '@/panel/field-list'
import { countryName, emptyNumbers, flagOf, joinDays, type Numbers } from '@/panel/lib/numbers'
import { mountPanel, recordingSlots } from './helpers'

describe('joining visits and plays by day', () => {
  it('lays both over the same days, in order, with a zero where one is missing', () => {
    expect(
      joinDays(
        [
          { date: '2026-09-19', count: 30 },
          { date: '2026-09-18', count: 12 },
        ],
        [
          { date: '2026-09-19', count: 4 },
          { date: '2026-09-20', count: 2 },
        ],
      ),
    ).toEqual([
      { date: '2026-09-18', visits: 12, plays: 0 },
      { date: '2026-09-19', visits: 30, plays: 4 },
      { date: '2026-09-20', visits: 0, plays: 2 },
    ])
  })

  it('gives nothing for a quiet period', () => {
    expect(joinDays([], [])).toEqual([])
  })
})

describe('a country by its two letters', () => {
  it('draws the flag a phone and a laptop both show', () => {
    expect(flagOf('LT')).toBe('🇱🇹')
    expect(flagOf(' gb ')).toBe('🇬🇧')
  })

  it('draws no flag for anything that is not two letters', () => {
    expect(flagOf('Lithuania')).toBe('')
    expect(flagOf('')).toBe('')
  })

  it('names the country the way people say it', () => {
    expect(countryName('DE')).toBe('Germany')
    expect(countryName('XYZ')).toBe('XYZ')
  })
})

const start: Content = {
  sections: [],
  values: {
    contact: {
      links: [{ id: 'ig', platform: 'instagram', text: '@shop', url: 'https://instagram.com/shop' }],
    },
  },
}

const counted: Numbers = {
  ...emptyNumbers(),
  visits: [
    { date: '2026-09-18', count: 12 },
    { date: '2026-09-19', count: 30 },
  ],
  plays: [{ date: '2026-09-19', count: 5 }],
  countries: [{ code: 'LT', visits: 28 }],
  sources: [{ name: 'google.com', visits: 9 }],
  taps: [
    { link: 'ig', count: 7 },
    { link: 'gone', count: 1 },
  ],
  stays: [{ section: 'shop', seconds: 120, visits: 4 }],
}

async function openNumbers(numbers: Numbers = counted) {
  const recorded = recordingSlots(start)
  recorded.numbers.load.mockResolvedValue(numbers)
  const user = await mountPanel(recorded.slots)
  await user.click(screen.getByRole('button', { name: 'Numbers' }))
  return { ...recorded, user }
}

describe('the Numbers page', () => {
  it('reads the last 30 days and draws what the numbers code returns', async () => {
    const { numbers } = await openNumbers()
    await screen.findByText('42')
    expect(numbers.load).toHaveBeenCalledWith(30)
    expect(screen.getByText('42 in the last 30 days')).toBeTruthy()
    const country = document.querySelector('[data-listing="Which country"]') as HTMLElement
    expect(within(country).getByText('Lithuania')).toBeTruthy()
    expect(within(country).getByText('🇱🇹')).toBeTruthy()
  })

  it('names what they pressed from the links on the site, with its mark', async () => {
    await openNumbers()
    const pressed = (await screen.findByText('What they pressed')).closest('[data-listing]') as HTMLElement
    expect(within(pressed).getByText('Instagram')).toBeTruthy()
    expect(within(pressed).getByText('@shop')).toBeTruthy()
    expect(pressed.querySelector('[data-brand="instagram"]')).toBeTruthy()
    // a link no longer on the site keeps its id rather than vanishing
    expect(within(pressed).getByText('gone')).toBeTruthy()
  })

  it('names the sections from the field list', async () => {
    await openNumbers()
    const stays = (await screen.findByText('Where they spend their time')).closest(
      '[data-listing]',
    ) as HTMLElement
    expect(within(stays).getByText('Shop')).toBeTruthy()
    expect(within(stays).getByText('30s')).toBeTruthy()
  })

  it('reads again for another period', async () => {
    const { user, numbers } = await openNumbers()
    await screen.findByText('42')
    await user.click(screen.getByRole('button', { name: '7 days' }))
    await waitFor(() => expect(numbers.load).toHaveBeenLastCalledWith(7))
  })

  it('Check again reads once more', async () => {
    const { user, numbers } = await openNumbers()
    await screen.findByText('42')
    await user.click(screen.getByRole('button', { name: 'Check again' }))
    await waitFor(() => expect(numbers.load).toHaveBeenCalledTimes(2))
  })

  it('says when counting is not switched on', async () => {
    await openNumbers({ ...emptyNumbers(), ready: false })
    await screen.findByText('Counting is not switched on for this site yet.')
  })

  it('shows a waiting state, then the problem when the numbers cannot be read', async () => {
    const recorded = recordingSlots(start)
    let fail: (e: Error) => void = () => {}
    recorded.numbers.load.mockImplementation(() => new Promise<Numbers>((_, no) => (fail = no)))
    const user = await mountPanel(recorded.slots)
    await user.click(screen.getByRole('button', { name: 'Numbers' }))
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy()
    fail(new Error('offline'))
    await screen.findByText(/The numbers could not be read: .*offline/)
  })
})
