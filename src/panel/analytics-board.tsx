import {
  Clapperboard,
  Eye,
  Globe,
  Image as ImageIcon,
  Images,
  Layers,
  Link2,
  List,
  MapPin,
  MousePointerClick,
  Play,
  RefreshCw,
  Timer,
  Type,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VisitsAgainstPlays, VisitsBars } from './analytics-chart'
import { BrandIcon, hasBrand } from './brand-icon'
import type { FieldType, StoredSection } from './field-list'
import { IconButton } from './icon-button'
import type { NamedLink } from './lib/links'
import { asTime, countryName, flagOf, joinDays, total, type Numbers } from './lib/numbers'
import { Thumb } from './thumb'
import { WORDS } from './words'

/** Where the numbers have got to. */
export type NumbersState =
  | { name: 'loading' }
  | { name: 'error'; problem: string }
  | { name: 'ready'; numbers: Numbers; at: number }

/** The periods the owner can choose between. */
export const PERIODS = [7, 30, 90]

/** The Numbers page, fed by the panel. */
export type AnalyticsBoardProps = {
  days: number
  onDays: (days: number) => void
  state: NumbersState
  onRefresh: () => void
  /** The sections, for the names and marks of "where they spend their time". */
  sections: StoredSection[]
  /** Every link on the site, for the names and marks of "what they pressed". */
  links: NamedLink[]
}

// A section's mark comes from the kind of box it is mostly about, so the
// field list needs no icons of its own.
const MARKS: Record<FieldType, LucideIcon> = {
  text: Type,
  longText: Type,
  picture: ImageIcon,
  pictures: Images,
  video: Clapperboard,
  items: List,
  links: Link2,
  custom: Layers,
}

/** The mark for a section, from its first box. */
export function sectionMark(section: StoredSection | undefined): LucideIcon {
  const first = section?.fields.find((f) => f.type !== 'text') ?? section?.fields[0]
  return first ? MARKS[first.type] : Layers
}

function share(part: number, all: number): string {
  return all > 0 ? WORDS.numbers.ofVisits(Math.round((part / all) * 100)) : ''
}

function Figure({ title, value, under, icon: Icon }: {
  title: string
  value: string
  under: string
  icon: LucideIcon
}) {
  return (
    <Card className='gap-2 py-4'>
      <CardHeader className='flex flex-row items-center justify-between px-4'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <Icon className='text-muted-foreground size-4' />
      </CardHeader>
      <CardContent className='px-4'>
        <div className='text-2xl font-bold'>{value}</div>
        <p className='text-muted-foreground text-xs'>{under}</p>
      </CardContent>
    </Card>
  )
}

type Row = { name: string; under: string; value: string; flag?: string; brand?: string; icon?: LucideIcon; poster?: string }

function Listing({ title, blurb, icon, rows }: { title: string; blurb: string; icon: LucideIcon; rows: Row[] }) {
  return (
    <Card data-listing={title}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{blurb}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className='text-muted-foreground text-sm'>{WORDS.numbers.nothingYet}</p>
        ) : (
          <div className='space-y-4'>
            {rows.slice(0, 6).map((row) => (
              <div key={row.name} className='flex items-center gap-4'>
                {row.flag ? (
                  <span className='bg-muted flex size-16 shrink-0 items-center justify-center rounded-md border text-2xl'>
                    {row.flag}
                  </span>
                ) : row.brand ? (
                  <span className='bg-muted flex size-16 shrink-0 items-center justify-center rounded-md border'>
                    <BrandIcon platform={row.brand} className='size-6' />
                  </span>
                ) : (
                  <Thumb url={row.poster ?? ''} icon={row.icon ?? icon} />
                )}
                <div className='flex flex-1 flex-wrap items-center justify-between gap-2'>
                  <div className='space-y-1'>
                    <p className='text-sm leading-none font-medium'>{row.name}</p>
                    <p className='text-muted-foreground text-sm'>{row.under}</p>
                  </div>
                  <div className='font-medium'>{row.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * How the site does: four numbers, the days as a chart, and lists of what
 * people watched, pressed and where they came from. Every name and mark comes
 * from the field list and the links on the site.
 */
export function AnalyticsBoard({ days, onDays, state, onRefresh, sections, links }: AnalyticsBoardProps) {
  const header = (
    <div className='flex items-center gap-2'>
      {PERIODS.map((period) => (
        <Button
          key={period}
          type='button'
          size='sm'
          variant={period === days ? 'default' : 'outline'}
          aria-pressed={period === days}
          onClick={() => onDays(period)}
        >
          {WORDS.numbers.days(period)}
        </Button>
      ))}
      <span className='text-muted-foreground ms-auto text-xs'>
        {state.name === 'ready'
          ? WORDS.numbers.readAt(
              new Date(state.at).toLocaleTimeString(WORDS.locale, { hour: '2-digit', minute: '2-digit' }),
            )
          : ''}
      </span>
      <IconButton label={WORDS.numbers.checkAgain} disabled={state.name === 'loading'} onClick={onRefresh}>
        <RefreshCw className={state.name === 'loading' ? 'animate-spin' : undefined} />
      </IconButton>
    </div>
  )

  if (state.name === 'loading') {
    return (
      <div className='space-y-4' aria-busy='true'>
        {header}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {[0, 1, 2, 3].map((n) => (
            <Skeleton key={n} className='h-28 w-full' />
          ))}
        </div>
        <Skeleton className='h-80 w-full' />
      </div>
    )
  }

  if (state.name === 'error') {
    return (
      <div className='space-y-4'>
        {header}
        <p className='text-destructive max-w-prose text-sm'>{WORDS.numbers.readFailed(state.problem)}</p>
      </div>
    )
  }

  const seen = state.numbers
  if (!seen.ready) {
    return (
      <div className='space-y-4'>
        {header}
        <p className='text-muted-foreground max-w-prose text-sm'>
          {WORDS.numbers.off}
        </p>
      </div>
    )
  }

  const visits = total(seen.visits)
  const byDay = joinDays(seen.visits, seen.plays)
  const watchedMost = seen.videos.filter((v) => v.plays > 0).slice(0, 3)

  return (
    <div className='space-y-4'>
      {header}

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Figure title={WORDS.numbers.visits} value={String(visits)} under={WORDS.numbers.visitsUnder} icon={Users} />
        <Figure title={WORDS.numbers.plays} value={String(total(seen.plays))} under={WORDS.numbers.playsUnder} icon={Play} />
        <Figure title={WORDS.numbers.watched} value={asTime(seen.watched)} under={WORDS.numbers.watchedUnder} icon={Timer} />
        <Figure title={WORDS.numbers.through} value={`${seen.watchedThrough}%`} under={WORDS.numbers.throughUnder} icon={Eye} />
      </div>

      <Tabs defaultValue='visits' className='gap-4'>
        <TabsList>
          <TabsTrigger value='visits'>{WORDS.numbers.byDay}</TabsTrigger>
          <TabsTrigger value='both'>{WORDS.numbers.against}</TabsTrigger>
        </TabsList>
        <TabsContent value='visits'>
          <div className='grid gap-4 lg:grid-cols-7'>
            <Card className='lg:col-span-4'>
              <CardHeader>
                <CardTitle>{WORDS.numbers.visits}</CardTitle>
                <CardDescription>{WORDS.numbers.inLast(visits, days)}</CardDescription>
              </CardHeader>
              <CardContent className='ps-2'>
                <VisitsBars data={byDay} />
              </CardContent>
            </Card>
            <div className='lg:col-span-3'>
              <Listing
                title={WORDS.numbers.mostWatched}
                blurb={watchedMost.length === 0 ? WORDS.numbers.noPlays : WORDS.numbers.playedMost}
                icon={Play}
                rows={watchedMost.map((v) => ({
                  name: v.title,
                  poster: v.poster,
                  under: WORDS.numbers.stays(asTime(v.usualStay), asTime(v.length)),
                  value: WORDS.numbers.playsCount(v.plays),
                }))}
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value='both'>
          <Card>
            <CardHeader>
              <CardTitle>{WORDS.numbers.against}</CardTitle>
              <CardDescription>{WORDS.numbers.againstBlurb}</CardDescription>
            </CardHeader>
            <CardContent className='ps-2'>
              <VisitsAgainstPlays data={byDay} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className='grid gap-4 md:grid-cols-2'>
        <Listing
          title={WORDS.numbers.pressed}
          blurb={WORDS.numbers.pressedBlurb}
          icon={MousePointerClick}
          rows={seen.taps.map((tap) => {
            const link = links.find((l) => l.id === tap.link)
            return {
              name: link?.platformName ?? tap.link,
              brand: link && hasBrand(link.platform) ? link.platform : undefined,
              icon: Link2,
              under: link?.text || WORDS.numbers.times(tap.count),
              value: String(tap.count),
            }
          })}
        />
        <Listing
          title={WORDS.numbers.spend}
          blurb={WORDS.numbers.spendBlurb}
          icon={Timer}
          rows={seen.stays.map((stay) => {
            const section = sections.find((s) => s.id === stay.section)
            return {
              name: section?.label ?? stay.section,
              icon: sectionMark(section),
              under: WORDS.numbers.visitCount(stay.visits),
              value: asTime(stay.seconds / Math.max(stay.visits, 1)),
            }
          })}
        />
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <Listing
          title={WORDS.numbers.from}
          blurb={WORDS.numbers.fromBlurb}
          icon={Globe}
          rows={seen.sources.map((s) => ({ name: s.name, under: share(s.visits, visits), value: String(s.visits) }))}
        />
        <Listing
          title={WORDS.numbers.country}
          blurb={WORDS.numbers.countryBlurb}
          icon={MapPin}
          rows={seen.countries.map((c) => ({
            name: countryName(c.code),
            flag: flagOf(c.code),
            under: share(c.visits, visits),
            value: String(c.visits),
          }))}
        />
      </div>
    </div>
  )
}
