import { useState } from 'react'
import { ChevronRight, Send } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { StoredSection } from './field-list'
import type { NamedLink } from './lib/links'
import { asTime, countryName, flagOf } from './lib/numbers'
import { dayName, type Referral, type ReferralVisit, type ReferralVisits } from './lib/referrals'
import { WORDS } from './words'

/** The Referrals card on the Analytics page. */
export type ReferralVisitsCardProps = {
  counted: ReferralVisits[]
  referrals: Referral[]
  sections: StoredSection[]
  links: NamedLink[]
}

function when(at: string): string {
  const day = new Date(at)
  if (Number.isNaN(day.getTime())) return at
  return day.toLocaleString(WORDS.locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * One line per referral: its name, who it went to, how many visits. Clicking
 * a line opens every visit it brought, one under another.
 */
export function ReferralVisitsCard({ counted, referrals, sections, links }: ReferralVisitsCardProps) {
  const [open, setOpen] = useState<string | null>(null)
  // Busiest first; a referral with no visits yet still shows, at the bottom.
  const rows = [
    ...counted.map((c) => ({ id: c.referral, visits: c.visits })),
    ...referrals.filter((r) => !counted.some((c) => c.referral === r.id)).map((r) => ({ id: r.id, visits: [] })),
  ].sort((a, b) => b.visits.length - a.visits.length)
  const named = (id: string) => referrals.find((r) => r.id === id)
  const opened = rows.find((r) => r.id === open)
  const openedReferral = open ? named(open) : undefined

  return (
    <Card data-listing={WORDS.numbers.referrals}>
      <CardHeader>
        <CardTitle>{WORDS.numbers.referrals}</CardTitle>
        <CardDescription>{WORDS.numbers.referralsBlurb}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className='text-muted-foreground text-sm'>{WORDS.numbers.noReferralVisits}</p>
        ) : (
          <div className='-mx-2 space-y-1'>
            {rows.map((row) => {
              const referral = named(row.id)
              const last = row.visits[0]
              return (
                <button
                  key={row.id}
                  type='button'
                  data-referral-row={row.id}
                  className='hover:bg-muted flex w-full items-center gap-4 rounded-md px-2 py-2 text-start'
                  onClick={() => setOpen(row.id)}
                >
                  <span className='bg-muted flex size-10 shrink-0 items-center justify-center rounded-md border'>
                    <Send className='text-muted-foreground size-4' />
                  </span>
                  <span className='min-w-0 flex-1 space-y-1'>
                    <span className='block truncate text-sm font-medium'>
                      {referral?.name ?? WORDS.numbers.referralGone}
                    </span>
                    <span className='text-muted-foreground block truncate text-sm'>
                      {[referral?.buyer, last ? WORDS.numbers.lastVisit(when(last.at)) : '']
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </span>
                  <span className='font-medium'>{WORDS.numbers.visitCount(row.visits.length)}</span>
                  <ChevronRight className='text-muted-foreground size-4' />
                </button>
              )
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={opened !== undefined} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent className='max-h-[85svh] overflow-y-auto sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              {WORDS.numbers.referralVisitsTitle(openedReferral?.name ?? WORDS.numbers.referralGone)}
            </DialogTitle>
            <DialogDescription>
              {openedReferral
                ? WORDS.numbers.referralSent(openedReferral.buyer, dayName(openedReferral.sentOn))
                : ''}
            </DialogDescription>
          </DialogHeader>
          {opened && opened.visits.length === 0 && (
            <p className='text-muted-foreground text-sm'>{WORDS.numbers.nothingYet}</p>
          )}
          <ol className='space-y-3'>
            {opened?.visits.map((visit, at) => (
              <VisitLine key={`${visit.at}-${at}`} visit={visit} sections={sections} links={links} />
            ))}
          </ol>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function VisitLine({ visit, sections, links }: { visit: ReferralVisit; sections: StoredSection[]; links: NamedLink[] }) {
  const longest = visit.longest ? (sections.find((s) => s.id === visit.longest)?.label ?? visit.longest) : null
  const tapped = visit.taps.map((id) => {
    const link = links.find((l) => l.id === id)
    return link?.text || link?.platformName || id
  })
  return (
    <li data-visit={visit.at} className='rounded-md border p-3 text-sm'>
      <div className='flex items-center justify-between gap-2'>
        <span className='font-medium'>{when(visit.at)}</span>
        {visit.country && (
          <span className='text-muted-foreground flex items-center gap-1.5'>
            <span>{flagOf(visit.country)}</span>
            <span>{countryName(visit.country)}</span>
          </span>
        )}
      </div>
      <dl className='text-muted-foreground mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1'>
        <dt>{WORDS.numbers.stayed}</dt>
        <dd className='text-foreground'>{asTime(visit.seconds)}</dd>
        {longest && (
          <>
            <dt>{WORDS.numbers.readLongest}</dt>
            <dd className='text-foreground'>{longest}</dd>
          </>
        )}
        <dt>{WORDS.numbers.tapped}</dt>
        <dd className='text-foreground'>{tapped.length > 0 ? tapped.join(', ') : WORDS.numbers.nothingTapped}</dd>
      </dl>
    </li>
  )
}
