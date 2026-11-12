import { useEffect, useState, type FormEvent } from 'react'
import { Copy, LoaderCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AskFirst } from './ask-first'
import { GREEN, IconButton } from './icon-button'
import { dayName, pathFor, pathProblem, referralAddress, type Referral } from './lib/referrals'
import type { ReferralsSlot } from './slots'
import { WORDS } from './words'

/** Today as 2026-11-12, by the owner's own clock. */
export function today(now = new Date()): string {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

type Listed =
  | { name: 'loading' }
  | { name: 'error'; problem: string }
  | { name: 'ready'; referrals: Referral[] }

/** The Referrals page: make one, and see, copy or remove the ones made. */
export type ReferralsPageProps = { slot: ReferralsSlot }

/**
 * Makes referrals and lists them. Every number about them sits on the
 * Analytics page; this page only makes, copies and removes.
 */
export function ReferralsPage({ slot }: ReferralsPageProps) {
  const [listed, setListed] = useState<Listed>({ name: 'loading' })
  const [name, setName] = useState('')
  const [buyer, setBuyer] = useState('')
  const [sentOn, setSentOn] = useState(today)
  const [path, setPath] = useState('')
  // The address follows the name until the owner types her own.
  const [ownPath, setOwnPath] = useState(false)
  const [tried, setTried] = useState(false)
  const [making, setMaking] = useState(false)
  const [asking, setAsking] = useState<Referral | null>(null)

  useEffect(() => {
    let gone = false
    slot
      .list()
      .then((referrals) => {
        if (!gone) setListed({ name: 'ready', referrals })
      })
      .catch((error: unknown) => {
        if (!gone) setListed({ name: 'error', problem: String(error) })
      })
    return () => {
      gone = true
    }
  }, [slot])

  const referrals = listed.name === 'ready' ? listed.referrals : []
  const taken = [...slot.reserved, ...referrals.map((r) => r.path)]
  const wrongPath = pathProblem(path, taken)
  const noName = name.trim() === ''

  async function make(event: FormEvent) {
    event.preventDefault()
    setTried(true)
    if (noName || wrongPath || listed.name !== 'ready') return
    setMaking(true)
    try {
      const made = await slot.add({ name: name.trim(), buyer: buyer.trim(), sentOn, path })
      setListed({ name: 'ready', referrals: [made, ...referrals] })
      setName('')
      setBuyer('')
      setPath('')
      setOwnPath(false)
      setTried(false)
      toast.success(WORDS.referrals.made(made.name))
    } catch (error) {
      toast.error(WORDS.referrals.addFailed(String(error)))
    } finally {
      setMaking(false)
    }
  }

  async function remove(referral: Referral) {
    try {
      await slot.remove(referral.id)
      setListed({ name: 'ready', referrals: referrals.filter((r) => r.id !== referral.id) })
    } catch (error) {
      toast.error(WORDS.referrals.removeFailed(String(error)))
    }
  }

  async function copy(referral: Referral) {
    try {
      await navigator.clipboard.writeText(referralAddress(slot.site, referral.path))
      toast.success(WORDS.referrals.copied)
    } catch {
      // A browser that refuses the clipboard still shows the address to select by hand.
    }
  }

  return (
    <div className='w-full max-w-[560px] space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>{WORDS.referrals.newTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className='space-y-4' onSubmit={(e) => void make(e)} noValidate>
            <div className='space-y-2'>
              <Label htmlFor='referral-name'>{WORDS.referrals.name}</Label>
              <Input
                id='referral-name'
                value={name}
                placeholder={WORDS.referrals.namePlaceholder}
                aria-invalid={tried && noName}
                onChange={(e) => {
                  setName(e.target.value)
                  if (!ownPath) setPath(pathFor(e.target.value))
                }}
              />
              {tried && noName && <p className='text-destructive text-sm'>{WORDS.referrals.needsName}</p>}
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='referral-buyer'>{WORDS.referrals.buyer}</Label>
                <Input
                  id='referral-buyer'
                  value={buyer}
                  placeholder={WORDS.referrals.buyerPlaceholder}
                  onChange={(e) => setBuyer(e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='referral-sent'>{WORDS.referrals.sentOn}</Label>
                <Input
                  id='referral-sent'
                  type='date'
                  value={sentOn}
                  onChange={(e) => setSentOn(e.target.value)}
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='referral-path'>{WORDS.referrals.address}</Label>
              <div className='flex items-center gap-1'>
                <span className='text-muted-foreground shrink-0 text-sm'>
                  {referralAddress(slot.site, '')}
                </span>
                <Input
                  id='referral-path'
                  value={path}
                  aria-invalid={(tried || path !== '') && wrongPath !== null}
                  onChange={(e) => {
                    setOwnPath(true)
                    setPath(e.target.value.trim().toLowerCase())
                  }}
                />
              </div>
              {(tried || path !== '') && wrongPath && (
                <p className='text-destructive text-sm'>{WORDS.referrals[wrongPath]}</p>
              )}
            </div>
            <Button type='submit' className={GREEN} disabled={making || listed.name !== 'ready'}>
              {making ? WORDS.referrals.making : WORDS.referrals.make}
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className='space-y-3'>
        <h2 className='px-1 text-sm font-medium'>{WORDS.referrals.yours}</h2>
        {listed.name === 'loading' && (
          <p className='text-muted-foreground flex items-center gap-2 text-sm'>
            <LoaderCircle className='size-4 animate-spin' /> {WORDS.referrals.loading}
          </p>
        )}
        {listed.name === 'error' && (
          <p className='text-destructive text-sm'>{WORDS.referrals.loadFailed(listed.problem)}</p>
        )}
        {listed.name === 'ready' && referrals.length === 0 && (
          <p className='text-muted-foreground text-sm'>{WORDS.referrals.none}</p>
        )}
        {referrals.map((referral) => (
          <Card key={referral.id} data-referral={referral.id} className='gap-1 p-3'>
            <div className='flex items-center gap-2'>
              <div className='min-w-0 flex-1 space-y-1'>
                <p className='text-sm font-medium'>{referral.name}</p>
                <p className='text-muted-foreground text-sm'>
                  {WORDS.referrals.sentTo(referral.buyer, dayName(referral.sentOn))}
                </p>
                <p className='truncate text-sm select-all'>{referralAddress(slot.site, referral.path)}</p>
              </div>
              <IconButton label={WORDS.referrals.copy(referral.name)} onClick={() => void copy(referral)}>
                <Copy />
              </IconButton>
              <IconButton label={WORDS.referrals.remove(referral.name)} onClick={() => setAsking(referral)}>
                <Trash2 />
              </IconButton>
            </div>
          </Card>
        ))}
      </section>

      <AskFirst
        open={asking !== null}
        onOpenChange={(open) => !open && setAsking(null)}
        title={asking ? WORDS.referrals.removeTitle(asking.name) : ''}
        action={WORDS.ask.remove}
        onConfirm={() => {
          if (asking) void remove(asking)
          setAsking(null)
        }}
      >
        {WORDS.referrals.removeBody}
      </AskFirst>
    </div>
  )
}
