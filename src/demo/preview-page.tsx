// DEMO ONLY. Stands in for the site inside the preview frame: it draws the
// content it is sent, plainly, and scrolls to the box being edited. A real
// site draws its own pages instead; see AGENTS.md.

import { useEffect, useState } from 'react'
import type { Content, JsonValue, StoredField } from '@/panel/field-list'
import { readItems, readLinks, readPictures, readText } from '@/panel/lib/values'
import type { PreviewUpdate } from '@/panel/slots'
import { PREVIEW_MESSAGE } from '@/slots/preview'

function Picture({ url }: { url: string }) {
  return url ? (
    <img src={url} alt='' className='w-full rounded-lg object-cover' />
  ) : (
    <div className='bg-muted text-muted-foreground grid aspect-video w-full place-items-center rounded-lg text-sm'>
      No picture yet
    </div>
  )
}

function Value({ field, value }: { field: StoredField; value: JsonValue | undefined }) {
  switch (field.type) {
    case 'text':
      return <p className='text-2xl font-semibold'>{readText(value)}</p>
    case 'longText':
      return <p className='text-muted-foreground whitespace-pre-line'>{readText(value)}</p>
    case 'picture':
      return <Picture url={readText(value)} />
    case 'pictures':
      return (
        <div className='grid grid-cols-2 gap-2'>
          {readPictures(value).map((url, at) => (
            <Picture key={at} url={url} />
          ))}
        </div>
      )
    case 'video':
      return readText(value) ? (
        <video src={readText(value)} controls className='w-full rounded-lg' />
      ) : (
        <p className='text-muted-foreground text-sm'>No video yet</p>
      )
    case 'items': {
      const { items, collections } = readItems(value)
      return (
        <div className='space-y-4'>
          {collections.map((c) => (
            <div key={c.id}>
              <h3 className='font-medium'>{c.name}</h3>
              <ul className='grid grid-cols-2 gap-2'>
                {items
                  .filter((i) => i.collection === c.id)
                  .map((i) => (
                    <li key={i.id} className='space-y-1'>
                      <Picture url={i.picture} />
                      <span className='block text-sm'>{i.name}</span>
                      <span className='text-muted-foreground block text-xs'>{i.tag}</span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )
    }
    case 'links':
      return (
        <ul className='flex flex-wrap gap-3'>
          {readLinks(value).map((l) => (
            <li key={l.id}>
              <a href={l.url} className='underline'>
                {l.text || l.platform}
              </a>
            </li>
          ))}
        </ul>
      )
    case 'custom': {
      const text = typeof value === 'string' ? value : JSON.stringify(value ?? null)
      return (
        <p className='text-muted-foreground flex items-center gap-2 text-sm'>
          {/^#[0-9a-f]{3,8}$/i.test(text) && (
            <span className='size-4 rounded border' style={{ background: text }} />
          )}
          {text}
        </p>
      )
    }
  }
}

/** The demo site, drawn from whatever the panel last sent. */
export function PreviewPage() {
  const [content, setContent] = useState<Content | null>(null)
  const [focus, setFocus] = useState<PreviewUpdate['focus']>(null)

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      const said = event.data as { kind?: string; update?: PreviewUpdate }
      if (said.kind !== PREVIEW_MESSAGE || !said.update) return
      setContent(said.update.content)
      setFocus(said.update.focus)
    }
    window.addEventListener('message', onMessage)
    // tells the panel this page is listening, so it sends the latest at once
    window.parent.postMessage({ thorPreview: 'ready' }, window.location.origin)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    if (!focus) return
    const where = focus.field ? `${focus.section}/${focus.field}` : focus.section
    document
      .querySelector(`[data-look="${CSS.escape(where)}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focus])

  if (!content) return <p className='p-6 text-sm'>Waiting for the panel…</p>

  const looking = focus?.field ? `${focus.section}/${focus.field}` : focus?.section

  return (
    <main className='mx-auto max-w-3xl space-y-12 p-6'>
      {content.sections
        .filter((s) => !s.hidden)
        .map((section) => (
          <section
            key={section.id}
            data-look={section.id}
            className='space-y-4 border-b pb-12 last:border-0'
          >
            <h2 className='text-muted-foreground text-xs uppercase'>{section.label}</h2>
            {section.fields.map((field) => {
              const where = `${section.id}/${field.key}`
              return (
                <div
                  key={field.key}
                  data-look={where}
                  className={looking === where ? 'rounded-lg ring-2 ring-emerald-500 ring-offset-4' : ''}
                >
                  <Value field={field} value={content.values[section.id]?.[field.key]} />
                </div>
              )
            })}
          </section>
        ))}
    </main>
  )
}
