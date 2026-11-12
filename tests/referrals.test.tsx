import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { emptyNumbers, type Numbers } from '@/panel/lib/numbers'
import { dayName, pathFor, pathProblem, referralAddress, type Referral } from '@/panel/lib/referrals'
import type { ReferralsSlot } from '@/panel/slots'
import { mountPanel, recordingSlots } from './helpers'

describe('the address made from a name', () => {
  it('turns a name into small letters and dashes', () => {
    expect(pathFor('Majestic')).toBe('majestic')
    expect(pathFor('The Wine Society')).toBe('the-wine-society')
    expect(pathFor('  Berry Bros & Rudd ')).toBe('berry-bros-and-rudd')
    expect(pathFor('Château Pétrus!')).toBe('chateau-petrus')
  })

  it('says what is wrong with an address', () => {
    expect(pathProblem('', [])).toBe('empty')
    expect(pathProblem('Majestic', [])).toBe('letters')
    expect(pathProblem('wine--society', [])).toBe('letters')
    expect(pathProblem('admin', ['admin'])).toBe('taken')
    expect(pathProblem('majestic', ['admin'])).toBeNull()
  })

  it('joins the site and the path with one slash', () => {
    expect(referralAddress('https://example.com/', 'majestic')).toBe('https://example.com/majestic')
  })

  it('writes the date the way people say it', () => {
    expect(dayName('2026-11-12')).toBe('12 Nov 2026')
    expect(dayName('soon')).toBe('soon')
  })
})

const majestic: Referral = { id: 'r1', name: 'Majestic', buyer: 'Sarah Lee', sentOn: '2026-11-02', path: 'majestic' }

function referralSlot(start: Referral[] = [majestic]) {
  let kept = [...start]
  const slot = {
    site: 'https://example.com',
    reserved: ['admin'],
    list: vi.fn(async () => [...kept]),
    add: vi.fn(async (r: Omit<Referral, 'id'>) => {
      const one = { ...r, id: `r${kept.length + 1}` }
      kept = [one, ...kept]
      return one
    }),
    remove: vi.fn(async (id: string) => {
      kept = kept.filter((r) => r.id !== id)
    }),
  } satisfies ReferralsSlot
  return slot
}

async function openReferrals(slot = referralSlot()) {
  const recorded = recordingSlots(null)
  const user = await mountPanel({ ...recorded.slots, referrals: slot })
  await user.click(screen.getByRole('button', { name: 'Referrals' }))
  await screen.findByText('Majestic')
  return { user, slot }
}

describe('the Referrals page', () => {
  it('is in the menu only when the site gives referrals code', async () => {
    await mountPanel(recordingSlots(null).slots)
    expect(screen.queryByRole('button', { name: 'Referrals' })).toBeNull()
  })

  it('lists the referrals made, with who they went to and the whole address', async () => {
    await openReferrals()
    const row = document.querySelector('[data-referral="r1"]') as HTMLElement
    expect(within(row).getByText('Sarah Lee, sent 2 Nov 2026')).toBeTruthy()
    expect(within(row).getByText('https://example.com/majestic')).toBeTruthy()
  })

  it('fills the address from the name, and keeps one the owner typed', async () => {
    const { user } = await openReferrals()
    const name = screen.getByLabelText('Who it is for')
    const address = screen.getByLabelText('Address') as HTMLInputElement
    await user.type(name, 'The Wine Society')
    expect(address.value).toBe('the-wine-society')
    await user.clear(address)
    await user.type(address, 'tws')
    await user.type(name, ' UK')
    expect(address.value).toBe('tws')
  })

  it('makes a referral with the name, buyer, date and address', async () => {
    const { user, slot } = await openReferrals()
    await user.type(screen.getByLabelText('Who it is for'), 'Corney & Barrow')
    await user.type(screen.getByLabelText('Buyer'), 'Tom Hall')
    await user.clear(screen.getByLabelText('Date sent'))
    await user.type(screen.getByLabelText('Date sent'), '2026-11-10')
    await user.click(screen.getByRole('button', { name: 'Make referral' }))
    await waitFor(() =>
      expect(slot.add).toHaveBeenCalledWith({
        name: 'Corney & Barrow',
        buyer: 'Tom Hall',
        sentOn: '2026-11-10',
        path: 'corney-and-barrow',
      }),
    )
    expect(await screen.findByText('https://example.com/corney-and-barrow')).toBeTruthy()
  })

  it('refuses an address already in use, and one the site keeps for itself', async () => {
    const { user, slot } = await openReferrals()
    await user.type(screen.getByLabelText('Who it is for'), 'Majestic')
    expect(screen.getByText('That address is already in use. Pick another.')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Make referral' }))
    expect(slot.add).not.toHaveBeenCalled()
    const address = screen.getByLabelText('Address')
    await user.clear(address)
    await user.type(address, 'admin')
    expect(screen.getByText('That address is already in use. Pick another.')).toBeTruthy()
  })

  it('asks before it removes a referral', async () => {
    const { user, slot } = await openReferrals()
    await user.click(screen.getByRole('button', { name: 'Remove Majestic' }))
    expect(screen.getByText('Remove the referral for Majestic?')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(slot.remove).toHaveBeenCalledWith('r1'))
    await waitFor(() => expect(document.querySelector('[data-referral="r1"]')).toBeNull())
  })
})

const counted: Numbers = {
  ...emptyNumbers(),
  referrals: [
    {
      referral: 'r1',
      visits: [
        { at: '2026-11-12T10:30:00Z', seconds: 240, longest: 'shop', taps: ['ig'], country: 'GB' },
        { at: '2026-11-09T08:00:00Z', seconds: 45, longest: null, taps: [] },
      ],
    },
  ],
}

describe('referrals on the Analytics page', () => {
  async function openAnalytics() {
    const recorded = recordingSlots({
      sections: [],
      values: { contact: { links: [{ id: 'ig', platform: 'instagram', text: '@shop', url: 'https://instagram.com/shop' }] } },
    })
    recorded.numbers.load.mockResolvedValue(counted)
    const user = await mountPanel({ ...recorded.slots, referrals: referralSlot() })
    await user.click(screen.getByRole('button', { name: 'Analytics' }))
    const row = (await screen.findByText('Majestic')).closest('[data-referral-row]') as HTMLElement
    return { user, row }
  }

  it('shows one line per referral with its visit count', async () => {
    const { row } = await openAnalytics()
    expect(within(row).getByText('2 visits')).toBeTruthy()
    expect(within(row).getByText(/Sarah Lee/)).toBeTruthy()
  })

  it('opens every visit of a referral in a dialog', async () => {
    const { user, row } = await openAnalytics()
    await user.click(row)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Visits from Majestic')).toBeTruthy()
    expect(within(dialog).getByText('Sent to Sarah Lee on 2 Nov 2026.')).toBeTruthy()
    expect(within(dialog).getByText('4m 0s')).toBeTruthy()
    expect(within(dialog).getByText('Shop')).toBeTruthy()
    expect(within(dialog).getByText('@shop')).toBeTruthy()
    expect(within(dialog).getByText('Nothing pressed')).toBeTruthy()
  })

  it('leaves the card out on a site without referrals', async () => {
    const recorded = recordingSlots(null)
    recorded.numbers.load.mockResolvedValue(counted)
    const user = await mountPanel(recorded.slots)
    await user.click(screen.getByRole('button', { name: 'Analytics' }))
    await screen.findByText('What they pressed')
    expect(screen.queryByText('Referrals')).toBeNull()
  })
})
