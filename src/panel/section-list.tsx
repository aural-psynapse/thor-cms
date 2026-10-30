import { ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { StoredSection } from './field-list'
import { moveSection } from './lib/section-order'
import { SortableList } from './sortable-list'

/** The sections of the page, and what happens when one is dragged, switched or opened. */
export type SectionListProps = {
  sections: StoredSection[]
  onChange: (next: StoredSection[]) => void
  onOpen: (id: string) => void
}

/**
 * The bands of the page, top to bottom, exactly as a visitor meets them. Each
 * has a handle to drag it by, its name, a switch to take it off the site, and
 * the whole card opens it.
 */
export function SectionList({ sections, onChange, onOpen }: SectionListProps) {
  function toggle(id: string, hidden: boolean) {
    onChange(sections.map((s) => (s.id === id ? { ...s, hidden } : s)))
  }

  return (
    <SortableList
      items={sections}
      isFixed={(s) => s.fixed === true}
      onMove={(from, to) => onChange(moveSection(sections, from, to))}
      renderRow={(section, row) => (
        <Card
          ref={row.ref}
          style={row.style}
          data-section={section.id}
          onClick={section.locked ? undefined : () => onOpen(section.id)}
          className={cn(
            'flex-row items-center gap-3 p-3',
            row.isDragging && 'z-10 shadow-lg',
            (section.hidden || section.locked) && 'opacity-60',
            section.locked ? 'cursor-default' : 'cursor-pointer',
          )}
        >
          {row.handle}

          <button
            type='button'
            disabled={section.locked}
            className='min-w-0 flex-1 truncate text-left text-sm font-medium'
          >
            {section.label}
            {section.hidden && (
              <span className='text-muted-foreground ms-2 text-xs font-normal'>
                not on the site
              </span>
            )}
          </button>

          {section.fixed ? (
            // The top bar and the footer stay where they are and stay on.
            <span className='text-muted-foreground text-xs'>always on</span>
          ) : (
            <Tooltip>
              {/* the switch keeps its own look; the span is only there to be hovered over */}
              <TooltipTrigger asChild>
                <span className='inline-flex'>
                  <Switch
                    checked={!section.hidden}
                    aria-label={
                      section.hidden
                        ? `Show ${section.label} on the site`
                        : `Hide ${section.label} from the site`
                    }
                    onClick={(event) => event.stopPropagation()}
                    onCheckedChange={(on) => toggle(section.id, !on)}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {section.hidden ? 'Show this section' : 'Hide this section'}
              </TooltipContent>
            </Tooltip>
          )}

          {section.locked ? (
            <span className='size-4' />
          ) : (
            <ChevronRight className='text-muted-foreground size-4' />
          )}
        </Card>
      )}
    />
  )
}
