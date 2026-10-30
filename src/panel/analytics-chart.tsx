import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ByDay } from './lib/numbers'
import { WORDS } from './words'

function shortDay(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(WORDS.locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

const AXIS = {
  stroke: '#888888',
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const

const TIP = {
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--background)',
  fontSize: 12,
}

/** The days to draw. */
export type ChartProps = { data: ByDay[] }

/** Visits as one bar a day. */
export function VisitsBars({ data }: ChartProps) {
  const shown = data.map((d) => ({ ...d, name: shortDay(d.date) }))
  return (
    <ResponsiveContainer width='100%' height={220}>
      <BarChart data={shown}>
        <XAxis dataKey='name' {...AXIS} interval='preserveStartEnd' minTickGap={24} />
        <YAxis {...AXIS} allowDecimals={false} />
        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={TIP} />
        <Bar name={WORDS.numbers.visits} dataKey='visits' fill='currentColor' radius={[4, 4, 0, 0]} className='fill-primary' />
      </BarChart>
    </ResponsiveContainer>
  )
}

/** How many came, and how many pressed play, as two washes of colour. */
export function VisitsAgainstPlays({ data }: ChartProps) {
  const shown = data.map((d) => ({ ...d, name: shortDay(d.date) }))
  return (
    <ResponsiveContainer width='100%' height={220}>
      <AreaChart data={shown}>
        <XAxis dataKey='name' {...AXIS} interval='preserveStartEnd' minTickGap={24} />
        <YAxis {...AXIS} allowDecimals={false} />
        <Tooltip contentStyle={TIP} />
        <Area
          name={WORDS.numbers.visits}
          type='monotone'
          dataKey='visits'
          stroke='currentColor'
          className='text-primary'
          fill='currentColor'
          fillOpacity={0.15}
        />
        <Area
          name={WORDS.numbers.plays}
          type='monotone'
          dataKey='plays'
          stroke='currentColor'
          className='text-muted-foreground'
          fill='currentColor'
          fillOpacity={0.1}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
