import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { AskFirst } from './ask-first'
import { BrandIcon } from './brand-icon'
import type { Platform } from './field-list'
import { IconButton } from './icon-button'
import { linkProblem, platformLabel } from './lib/links'
import { arrayMove } from './lib/section-order'
import { newId, type Link } from './lib/values'
import { SortableList } from './sortable-list'

/** A list of links, each with its platform. */
export type LinkListProps = {
  label: string
  links: Link[]
  platforms: Platform[]
  onChange: (next: Link[]) => void
  onLook?: () => void
  disabled?: boolean
}

/** The links in the order they appear on the page, each with its own mark. */
export function LinkList({ label, links, platforms, onChange, onLook, disabled = false }: LinkListProps) {
  const [asking, setAsking] = useState<Link | null>(null)

  function edit(next: Link) {
    onChange(links.map((l) => (l.id === next.id ? next : l)))
  }

  const name = (link: Link) => link.text || platformLabel(platforms, link.platform)

  return (
    <div className='space-y-2'>
      <h3 className='px-1 text-sm font-medium'>{label}</h3>
      <SortableList
        items={links}
        onMove={(from, to) => {
          const at = (id: string) => links.findIndex((l) => l.id === id)
          onChange(arrayMove(links, at(from), at(to)))
        }}
        renderRow={(link, row) => {
          const wrong = linkProblem(link.url)
          return (
            <Card
              ref={row.ref}
              style={row.style}
              data-link={link.id}
              className={cn('gap-3 p-3', row.isDragging && 'z-10 shadow-lg')}
            >
              <div className='flex items-center gap-2'>
                {row.handle}
                <BrandIcon platform={link.platform} className='size-5 shrink-0' />
                <select
                  aria-label={`Where ${name(link)} is`}
                  className='border-input bg-background h-8 min-w-0 flex-1 rounded-md border px-2 text-sm'
                  value={link.platform}
                  disabled={disabled}
                  onChange={(event) => edit({ ...link, platform: event.target.value })}
                >
                  {platforms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <IconButton
                  label={`Remove ${name(link)}`}
                  disabled={disabled}
                  onClick={() => setAsking(link)}
                >
                  <Trash2 />
                </IconButton>
              </div>

              <div className='space-y-1'>
                <Label htmlFor={`${link.id}-text`}>What the page shows</Label>
                <Input
                  id={`${link.id}-text`}
                  value={link.text}
                  disabled={disabled}
                  onFocus={onLook}
                  onChange={(event) => edit({ ...link, text: event.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor={`${link.id}-url`}>Where it goes</Label>
                <Input
                  id={`${link.id}-url`}
                  value={link.url}
                  disabled={disabled}
                  aria-invalid={wrong !== null}
                  placeholder='https://'
                  onFocus={onLook}
                  onChange={(event) => edit({ ...link, url: event.target.value })}
                />
                {wrong && <p className='text-destructive text-sm'>{wrong}</p>}
              </div>
            </Card>
          )
        }}
      />

      <AskFirst
        open={asking !== null}
        onOpenChange={(open) => !open && setAsking(null)}
        title={`Remove ${asking ? name(asking) : ''}?`}
        action='Remove'
        onConfirm={() => {
          if (asking) onChange(links.filter((l) => l.id !== asking.id))
          setAsking(null)
        }}
      >
        It comes off the site when you save.
      </AskFirst>

      <Button
        type='button'
        variant='outline'
        className='w-full gap-2'
        disabled={disabled}
        onClick={() => {
          const platform = platforms[0]?.id ?? 'website'
          onChange([
            ...links,
            { id: newId(platform, links.map((l) => l.id)), platform, text: '', url: '' },
          ])
        }}
      >
        <Plus className='size-4' /> Add a link
      </Button>
    </div>
  )
}
