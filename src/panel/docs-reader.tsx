import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { DocsGo } from '@/panel/panel'
import type { Page } from '@/panel/panel-menu'

// The help sheet's layout, copied from Linear's docs: guides down the left,
// the open guide in the middle, "On this page" on the right. The site writes
// the guides; this file only lays them out.

/** One heading inside a guide, with its words and screenshots under it. */
export type DocPart = { id: string; title: string; body: ReactNode; shots?: string[] }

/** One guide in the left list. `shots` and `cover` are picture addresses. */
export type DocGuide = {
  id: string
  group: string
  title: string
  icon: ElementType
  intro: ReactNode
  cover?: string
  parts: DocPart[]
}

const linkClass = 'font-medium text-foreground underline decoration-muted-foreground/50 underline-offset-[3px] hover:decoration-foreground'

/** A link that closes the help sheet and opens that place in the panel. */
export function DocLink({ go, page, section, children }: { go: DocsGo; page: Page; section?: string; children: ReactNode }) {
  return (
    <button type='button' className={cn(linkClass, 'cursor-pointer')} onClick={() => go({ page, section })}>
      {children}
    </button>
  )
}

/** A link to a page outside the panel, opened in a new tab. */
export function DocOut({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target='_blank' rel='noreferrer' className={linkClass}>
      {children}
    </a>
  )
}

function Shot({ src }: { src: string }) {
  return (
    <figure className='bg-muted/60 my-6 rounded-xl border p-3 sm:p-5'>
      <img src={src} alt='' loading='lazy' className='w-full rounded-lg border shadow-sm' />
    </figure>
  )
}

export type DocsReaderProps = {
  /** The guides. `show` opens another guide, for links between them. */
  guides: (show: (id: string) => void) => DocGuide[]
}

export function DocsReader({ guides }: DocsReaderProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const all = guides(setOpenId)
  const [here, setHere] = useState<string | null>(null)
  const page = useRef<HTMLDivElement>(null)

  const guide = all.find((g) => g.id === openId) ?? all[0]
  const groups = [...new Set(all.map((g) => g.group))]

  useEffect(() => {
    page.current?.scrollTo?.({ top: 0 })
    setHere(null)
  }, [openId])

  // "On this page" marks the part being read.
  useEffect(() => {
    const box = page.current
    if (!box || typeof IntersectionObserver === 'undefined') return
    const watch = new IntersectionObserver(
      (seen) => {
        const top = seen
          .filter((s) => s.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (top) setHere(top.target.id)
      },
      { root: box, rootMargin: '0px 0px -70% 0px' },
    )
    box.querySelectorAll('h2[id]').forEach((h) => watch.observe(h))
    return () => watch.disconnect()
  }, [openId])

  if (!guide) return null

  return (
    <div className='flex h-full min-h-0'>
      <nav aria-label='Guides' className='hidden w-56 shrink-0 overflow-y-auto border-e px-3 py-5 md:block'>
        {groups.map((group) => (
          <div key={group} className='mb-5'>
            <p className='text-muted-foreground mb-1 px-2 text-xs font-medium'>{group}</p>
            {all
              .filter((g) => g.group === group)
              .map((g) => (
                <button
                  key={g.id}
                  type='button'
                  onClick={() => setOpenId(g.id)}
                  aria-current={g.id === guide.id ? 'page' : undefined}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-start text-sm',
                    g.id === guide.id ? 'bg-accent text-foreground font-medium' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <g.icon className='size-4 shrink-0' />
                  {g.title}
                </button>
              ))}
          </div>
        ))}
      </nav>

      <div ref={page} className='min-w-0 flex-1 overflow-y-auto'>
        {/* On a phone the guides list does not fit beside the guide. */}
        <div className='border-b px-6 py-3 md:hidden'>
          <select
            aria-label='Guides'
            value={guide.id}
            onChange={(e) => setOpenId(e.target.value)}
            className='bg-background w-full rounded-md border px-2 py-1.5 text-sm'
          >
            {all.map((g) => (
              <option key={g.id} value={g.id}>
                {g.group} / {g.title}
              </option>
            ))}
          </select>
        </div>

        <div className='flex gap-10 px-6 py-6 lg:px-10'>
          <article className='min-w-0 max-w-[640px] flex-1 text-[15px] leading-7 [&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:text-[13px] [&_li]:my-1.5 [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-5'>
            <p className='text-muted-foreground text-sm'>
              {guide.group} <span className='mx-1.5'>/</span> <span className='text-foreground'>{guide.title}</span>
            </p>
            <h1 className='mt-6 text-3xl font-semibold tracking-tight'>{guide.title}</h1>
            <p className='text-muted-foreground'>{guide.intro}</p>
            {guide.cover && <Shot src={guide.cover} />}

            {guide.parts.map((part) => (
              <section key={part.id}>
                <h2 id={`part-${part.id}`} className='mt-12 scroll-mt-6 text-xl font-semibold tracking-tight'>
                  {part.title}
                </h2>
                {part.body}
                {part.shots?.map((s) => <Shot key={s} src={s} />)}
              </section>
            ))}
          </article>

          <aside className='hidden w-48 shrink-0 xl:block'>
            <div className='sticky top-6'>
              <p className='text-muted-foreground mb-2 text-xs font-medium'>On this page</p>
              <ul className='border-s text-sm'>
                {guide.parts.map((part) => (
                  <li key={part.id}>
                    <button
                      type='button'
                      onClick={() =>
                        document.getElementById(`part-${part.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                      className={cn(
                        '-ms-px block w-full cursor-pointer border-s py-1 ps-3 text-start',
                        here === `part-${part.id}`
                          ? 'border-foreground text-foreground'
                          : 'text-muted-foreground hover:text-foreground border-transparent',
                      )}
                    >
                      {part.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
