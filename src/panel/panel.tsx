import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Eye, LoaderCircle } from 'lucide-react'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { NumbersState } from './analytics-board'
import {
  rendersOf,
  startingContent,
  type Content,
  type FieldList,
  type JsonValue,
} from './field-list'
import type { FieldTools } from './field-box'
import { FieldsEditor } from './fields-editor'
import { fieldListProblem } from './lib/field-edit'
import { allLinks } from './lib/links'
import { sameContent, videosWaiting, withValue } from './lib/content'
import { waitForLive, type WaitParts } from './lib/wait-for-live'
import { SaveBar, type SaveStage } from './save-bar'
import { SectionEditor } from './section-editor'
import { SectionList } from './section-list'
import { SettingsPage } from './settings-page'
import { IconButton } from './icon-button'
import { PreviewPane } from './preview-pane'
import { PAGES, PanelMenu, type Page } from './panel-menu'

export type { Page }

const ALL_PAGES: Page[] = PAGES.map((p) => p.page)
import { WORDS } from './words'
import type { PreviewFocus, PreviewUpdate, Slots } from './slots'

// The charts are most of the panel's weight, so they load only when the
// Numbers page is opened.
const AnalyticsBoard = lazy(() =>
  import('./analytics-board').then((board) => ({ default: board.AnalyticsBoard })),
)

/** How often to ask whether a save is live, and when to give up. */
export type LiveCheck = Pick<WaitParts, 'everyMs' | 'giveUpAfter' | 'pause'>

/** The whole panel: the field list that draws it and the four slots it calls. */
export type PanelProps = {
  fields: FieldList
  slots: Slots
  /** The name at the top of the menu. */
  title?: string
  /** Where the menu's "Back to the site" button goes. */
  siteUrl?: string
  /**
   * The pages the owner gets, in menu order. All three by default. A site
   * whose design never changes leaves out "fields"; one that counts nothing
   * leaves out "numbers".
   */
  pages?: Page[]
  liveCheck?: LiveCheck
}

/**
 * The admin panel. It loads the content once, keeps the owner's changes in a
 * draft beside what was last saved, and only calls the content code when she
 * presses Save.
 */
export function Panel({
  fields,
  slots,
  title = WORDS.yourSite,
  siteUrl = '/',
  pages,
  liveCheck,
}: PanelProps) {
  const [saved, setSaved] = useState<Content | null>(null)
  const [draft, setDraft] = useState<Content | null>(null)
  const [loadProblem, setLoadProblem] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [stage, setStage] = useState<SaveStage>({ name: 'resting' })
  const [pending, setPending] = useState<Map<string, File>>(() => new Map())
  const [focus, setFocus] = useState<PreviewFocus | null>(null)
  const [fullPreview, setFullPreview] = useState(false)
  // A site can leave pages out of the menu. A page left out is never open,
  // whatever was picked before.
  // Left to itself, the panel shows Settings only when the field list has a
  // section that belongs there.
  const shown = useMemo(() => {
    const wanted =
      pages ??
      ALL_PAGES.filter((p) => p !== 'settings' || fields.some((s) => s.page === 'settings'))
    const kept = PAGES.filter((p) => wanted.includes(p.page))
    return kept.length > 0 ? kept : PAGES.slice(0, 1)
  }, [pages, fields])
  const [picked, setPage] = useState<Page>(shown[0]?.page ?? 'edit')
  const page = shown.some((p) => p.page === picked) ? picked : (shown[0]?.page ?? 'edit')
  const [days, setDays] = useState(30)
  const [numbers, setNumbers] = useState<NumbersState>({ name: 'loading' })
  const [asked, setAsked] = useState(0)
  const renders = useMemo(() => rendersOf(fields), [fields])
  const update = useMemo<PreviewUpdate | null>(
    () => (draft ? { content: draft, focus } : null),
    [draft, focus],
  )

  useEffect(() => {
    let gone = false
    slots.content
      .load()
      .then((loaded) => {
        if (gone) return
        const start = startingContent(fields, loaded)
        setSaved(start)
        setDraft(start)
      })
      .catch((error: unknown) => {
        if (!gone) setLoadProblem(WORDS.loadFailed(String(error)))
      })
    return () => {
      gone = true
    }
  }, [fields, slots.content])

  // The numbers are read when the page opens, when she picks another period,
  // and when she presses Check again.
  useEffect(() => {
    if (page !== 'numbers') return
    let gone = false
    setNumbers({ name: 'loading' })
    slots.numbers
      .load(days)
      .then((read) => {
        if (!gone) setNumbers({ name: 'ready', numbers: read, at: Date.now() })
      })
      .catch((error: unknown) => {
        if (!gone) setNumbers({ name: 'error', problem: String(error) })
      })
    return () => {
      gone = true
    }
  }, [page, days, asked, slots.numbers])

  if (loadProblem) {
    return <p className='text-destructive p-6 text-sm'>{loadProblem}</p>
  }
  if (!draft || !saved) {
    return (
      <p className='text-muted-foreground flex items-center gap-2 p-6 text-sm'>
        <LoaderCircle className='size-4 animate-spin' /> {WORDS.loading}
      </p>
    )
  }

  const dirty = !sameContent(draft, saved)
  const busy = stage.name === 'sending' || stage.name === 'saving'
  const section = draft.sections.find((s) => s.id === open) ?? null
  // Bands of the page go in the Edit list; the rest sit on the Settings page.
  const bands = draft.sections.filter((s) => s.page !== 'settings')
  const settingsSections = draft.sections.filter((s) => s.page === 'settings')

  // Any change after a save is finished starts a new round, so an old "live"
  // or a red line from before does not hang around over new work.
  function change(next: Content) {
    setDraft(next)
    if (stage.name === 'live' || stage.name === 'stuck') setStage({ name: 'resting' })
  }

  function setValue(sectionId: string, key: string, value: JsonValue) {
    if (draft) change(withValue(draft, sectionId, key, value))
  }

  // A picked video stays on her computer until Save. The preview plays it
  // from this address in the meantime.
  function holdVideo(file: File): string {
    const url = URL.createObjectURL(file)
    setPending((held) => new Map(held).set(url, file))
    return url
  }

  // Sends every picked video to the files code, one after another, and puts
  // each one's real address in place of the address on her computer.
  async function sendVideos(content: Content): Promise<Content> {
    const waiting = videosWaiting(content, pending)
    if (waiting.length === 0) return content
    const done = waiting.map(() => 0)
    const sum = () => done.reduce((a, b) => a + b, 0) / waiting.length
    setStage({ name: 'sending', done: 0 })
    let next = content
    for (const [at, video] of waiting.entries()) {
      const address = await slots.files.upload(video.file, {
        name: video.file.name,
        kind: 'video',
        onProgress: (part) => {
          done[at] = part
          setStage({ name: 'sending', done: sum() })
        },
      })
      next = withValue(next, video.section, video.key, address)
    }
    return next
  }

  async function save() {
    if (!draft) return
    // A field list the panel could not draw again is never saved.
    const wrongList = fieldListProblem(draft.sections)
    if (wrongList) {
      setStage({ name: 'stuck', problem: wrongList })
      return
    }
    let sending: Content
    try {
      sending = await sendVideos(draft)
    } catch (error) {
      setStage({
        name: 'stuck',
        problem: WORDS.save.videoFailed(String(error)),
      })
      return
    }
    setStage({ name: 'saving' })
    let version: number
    try {
      version = (await slots.content.save(sending)).version
    } catch (error) {
      setStage({ name: 'stuck', problem: WORDS.save.failed(String(error)) })
      return
    }
    setSaved(sending)
    setDraft(sending)
    setPending(new Map())
    setStage({ name: 'waiting' })
    const live = await waitForLive({
      isLive: () => slots.content.isLive(version),
      ...liveCheck,
    })
    setStage(
      live
        ? { name: 'live' }
        : {
            name: 'stuck',
            problem: WORDS.save.slow,
          },
    )
  }

  function openSection(id: string) {
    setOpen(id)
    setFocus({ section: id, field: null })
  }

  function cancel() {
    setDraft(saved)
    setPending(new Map())
    setStage({ name: 'resting' })
  }

  const tools: FieldTools = {
    disabled: busy,
    upload: slots.files.upload,
    renders,
    pendingVideos: pending,
    holdVideo,
  }

  const here = shown.find((p) => p.page === page) ?? PAGES[0]

  return (
    <TooltipProvider>
      <SidebarProvider>
        <PanelMenu title={title} pages={shown} page={page} onPage={setPage} siteUrl={siteUrl} />

        {/* Every page fills the screen: its columns scroll inside themselves,
            and the save bar sits under them at the bottom. */}
        <SidebarInset className='@container/content h-svh'>
          {/* On a laptop the menu is always there, so there is no top bar. On
              a phone the menu slides away and this slim bar brings it back. */}
          <header className='flex h-14 shrink-0 items-center gap-3 px-4 md:hidden'>
            <SidebarTrigger className='size-9' aria-label={WORDS.menu.openMenu} />
            <span className='me-auto truncate text-sm font-bold'>{title}</span>
            {/* There is no room beside the boxes, so the preview opens over
                the whole screen instead. */}
            {page === 'edit' && (
              <IconButton label={WORDS.preview.show} onClick={() => setFullPreview(true)}>
                <Eye />
              </IconButton>
            )}
          </header>

          <main data-layout='fixed' className='flex min-h-0 grow flex-col gap-4 overflow-hidden px-4 pt-4'>
            <div className='space-y-1'>
              <h1 className='text-2xl font-semibold'>{here.name}</h1>
              <p className='text-foreground text-sm'>{here.blurb}</p>
            </div>

            {page === 'numbers' && (
              <div className='min-h-0 flex-1 overflow-y-auto pb-6'>
                <Suspense fallback={<LoaderCircle className='size-4 animate-spin' />}>
                  <AnalyticsBoard
                    days={days}
                    onDays={setDays}
                    state={numbers}
                    onRefresh={() => setAsked((n) => n + 1)}
                    sections={draft.sections}
                    links={allLinks(draft)}
                  />
                </Suspense>
              </div>
            )}

            {page === 'fields' && (
              <div className='min-h-0 flex-1 overflow-y-auto pb-6'>
                <FieldsEditor content={draft} onChange={change} />
              </div>
            )}

            {page === 'settings' && (
              <div className='min-h-0 flex-1 overflow-y-auto pe-1 pb-6'>
                <SettingsPage
                  sections={settingsSections}
                  values={draft.values}
                  onChange={setValue}
                  tools={tools}
                />
              </div>
            )}

            <div className={cn('flex min-h-0 flex-1 gap-4', page !== 'edit' && 'hidden')}>
              {/* Only this column scrolls. The site beside it stays put. */}
              <div className='min-h-0 w-full shrink-0 overflow-y-auto pe-1 pb-2 lg:w-[460px]'>
                {section ? (
                  <SectionEditor
                    section={section}
                    values={draft.values[section.id] ?? {}}
                    onChange={(key, value) => setValue(section.id, key, value)}
                    onBack={() => setOpen(null)}
                    onLook={(key) => setFocus({ section: section.id, field: key })}
                    tools={tools}
                  />
                ) : (
                  <SectionList
                    sections={bands}
                    // The settings sections keep their places after the bands.
                    onChange={(next) => change({ ...draft, sections: [...next, ...settingsSections] })}
                    onOpen={openSection}
                  />
                )}
              </div>

              {update && (
                <PreviewPane
                  url={slots.preview.url}
                  update={update}
                  push={slots.preview.push}
                  full={fullPreview}
                  onFull={setFullPreview}
                  className='hidden min-h-0 flex-1 lg:grid'
                />
              )}
            </div>
          </main>

          {(dirty || stage.name !== 'resting') && (
            <SaveBar dirty={dirty} stage={stage} onSave={() => void save()} onCancel={cancel} />
          )}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
