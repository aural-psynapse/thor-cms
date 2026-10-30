import { useEffect, useState, type ElementType } from 'react'
import { BarChart3, Check, ExternalLink, Layers, ListTree, Monitor, Moon, Settings, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { WORDS } from './words'

/** The panel's pages. */
export type Page = 'edit' | 'settings' | 'numbers' | 'fields'

/** One page in the left menu: its name, the line under its title, its icon. */
export type PageInfo = { page: Page; name: string; blurb: string; icon: ElementType }

/** The pages in the order the owner meets them in the left menu. */
export const PAGES: PageInfo[] = [
  { page: 'edit', ...WORDS.pages.edit, icon: Layers },
  { page: 'settings', ...WORDS.pages.settings, icon: Settings },
  { page: 'numbers', ...WORDS.pages.numbers, icon: BarChart3 },
  { page: 'fields', ...WORDS.pages.fields, icon: ListTree },
]

type Theme = 'light' | 'dark' | 'system'
const THEME_KEY = 'panel-theme'

function readTheme(): Theme {
  try {
    const kept = localStorage.getItem(THEME_KEY)
    return kept === 'light' || kept === 'dark' ? kept : 'system'
  } catch {
    return 'system'
  }
}

// Light, dark, or whatever the computer is set to, kept in this browser only.
function useTheme(): [Theme, (next: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    const dark = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const on = theme === 'dark' || (theme === 'system' && dark.matches)
      document.documentElement.classList.toggle('dark', on)
    }
    apply()
    dark.addEventListener('change', apply)
    return () => dark.removeEventListener('change', apply)
  }, [theme])

  function choose(next: Theme) {
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      // a private window keeps the choice until the tab closes, which is fine
    }
    setTheme(next)
  }

  return [theme, choose]
}

const CHOICES = [
  { value: 'light', label: WORDS.menu.light, icon: Sun },
  { value: 'dark', label: WORDS.menu.dark, icon: Moon },
  { value: 'system', label: WORDS.menu.system, icon: Monitor },
] as const

/** The left menu: the site's name, the pages, and two buttons at the bottom. */
export type PanelMenuProps = {
  title: string
  /** The pages this site shows, in menu order. */
  pages: PageInfo[]
  page: Page
  onPage: (page: Page) => void
  /** Where "Back to the site" goes. */
  siteUrl: string
}

/**
 * The menu down the left side. On a laptop it narrows to a strip of icons; on
 * a phone it slides away and the button in the slim top bar brings it back.
 */
export function PanelMenu({ title, pages, page, onPage, siteUrl }: PanelMenuProps) {
  const { open, state, setOpenMobile } = useSidebar()
  const [theme, setTheme] = useTheme()
  const current = CHOICES.find((c) => c.value === theme) ?? CHOICES[2]
  // Narrowed to icons there is room beside a button for its label; open, a
  // label sticking out sideways over the page reads oddly, so it sits above.
  const side = state === 'collapsed' ? 'right' : 'top'

  return (
    <Sidebar collapsible='icon' variant='sidebar'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size='lg'
              className='gap-0 py-0 hover:bg-transparent active:bg-transparent'
              asChild
            >
              <div>
                {/* Narrowed to icons, the name has nowhere to go, so it steps
                    out and leaves the toggle alone in the strip. */}
                <span className='grid flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden'>
                  <span className='truncate font-bold'>{title}</span>
                  <span className='truncate text-xs'>{WORDS.menu.subtitle}</span>
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarTrigger className='mx-auto size-9 shrink-0 group-data-[collapsible=icon]:size-8' />
                  </TooltipTrigger>
                  <TooltipContent side={open ? 'top' : 'right'}>
                    {open ? WORDS.menu.narrow : WORDS.menu.widen}
                  </TooltipContent>
                </Tooltip>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{WORDS.menu.group}</SidebarGroupLabel>
          <SidebarMenu>
            {pages.map((one) => (
              <SidebarMenuItem key={one.page}>
                <SidebarMenuButton
                  isActive={page === one.page}
                  aria-current={page === one.page ? 'page' : undefined}
                  tooltip={one.name}
                  onClick={() => {
                    onPage(one.page)
                    setOpenMobile(false)
                  }}
                >
                  <one.icon />
                  <span>{one.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className='flex items-center gap-1 px-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:px-0'>
          <DropdownMenu modal={false}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='group-data-[collapsible=icon]:size-8'
                    aria-label={WORDS.menu.theme}
                  >
                    <current.icon />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side={side}>{WORDS.menu.theme}</TooltipContent>
            </Tooltip>
            {/* Without this, closing the list hands focus back to the button
                and its label pops up again as if nothing was chosen. */}
            <DropdownMenuContent side='top' align='start' onCloseAutoFocus={(e) => e.preventDefault()}>
              {CHOICES.map((choice) => (
                <DropdownMenuItem key={choice.value} onClick={() => setTheme(choice.value)}>
                  <choice.icon />
                  {choice.label}
                  <Check size={14} className={cn('ms-auto', theme !== choice.value && 'hidden')} />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='group-data-[collapsible=icon]:size-8'
                asChild
                aria-label={WORDS.menu.backToSite}
              >
                <a href={siteUrl} target='_blank' rel='noreferrer'>
                  <ExternalLink />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent side={side}>{WORDS.menu.backToSite}</TooltipContent>
          </Tooltip>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
