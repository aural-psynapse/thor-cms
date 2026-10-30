import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  rendersOf,
  startingContent,
  type Content,
  type FieldList,
  type JsonValue,
} from './field-list'
import type { FieldTools } from './field-box'
import { sameContent, videosWaiting, withValue } from './lib/content'
import { waitForLive, type WaitParts } from './lib/wait-for-live'
import { SaveBar, type SaveStage } from './save-bar'
import { SectionEditor } from './section-editor'
import { SectionList } from './section-list'
import type { Slots } from './slots'

/** How often to ask whether a save is live, and when to give up. */
export type LiveCheck = Pick<WaitParts, 'everyMs' | 'giveUpAfter' | 'pause'>

/** The whole panel: the field list that draws it and the four slots it calls. */
export type PanelProps = {
  fields: FieldList
  slots: Slots
  /** The name at the top. */
  title?: string
  liveCheck?: LiveCheck
}

/**
 * The admin panel. It loads the content once, keeps the owner's changes in a
 * draft beside what was last saved, and only calls the content code when she
 * presses Save.
 */
export function Panel({ fields, slots, title = 'Your site', liveCheck }: PanelProps) {
  const [saved, setSaved] = useState<Content | null>(null)
  const [draft, setDraft] = useState<Content | null>(null)
  const [loadProblem, setLoadProblem] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [stage, setStage] = useState<SaveStage>({ name: 'resting' })
  const [pending, setPending] = useState<Map<string, File>>(() => new Map())
  const renders = useMemo(() => rendersOf(fields), [fields])

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
        if (!gone) setLoadProblem(`Your content could not be loaded: ${String(error)}`)
      })
    return () => {
      gone = true
    }
  }, [fields, slots.content])

  if (loadProblem) {
    return <p className='text-destructive p-6 text-sm'>{loadProblem}</p>
  }
  if (!draft || !saved) {
    return (
      <p className='text-muted-foreground flex items-center gap-2 p-6 text-sm'>
        <LoaderCircle className='size-4 animate-spin' /> Loading your site…
      </p>
    )
  }

  const dirty = !sameContent(draft, saved)
  const busy = stage.name === 'sending' || stage.name === 'saving'
  const section = draft.sections.find((s) => s.id === open) ?? null

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
    let sending: Content
    try {
      sending = await sendVideos(draft)
    } catch (error) {
      setStage({
        name: 'stuck',
        problem: `Nothing was saved: the video did not go up. ${String(error)}`,
      })
      return
    }
    setStage({ name: 'saving' })
    let version: number
    try {
      version = (await slots.content.save(sending)).version
    } catch (error) {
      setStage({ name: 'stuck', problem: `Nothing was saved: ${String(error)}` })
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
            problem:
              'Your change is saved, but the site is taking longer than usual to update. Check back in a few minutes.',
          },
    )
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

  return (
    <TooltipProvider>
      <div className='flex h-svh flex-col'>
        <header className='flex items-center gap-2 border-b px-4 py-2'>
          <h1 className='me-auto text-base font-semibold'>{title}</h1>
        </header>

        <main className='flex min-h-0 flex-1 gap-4 p-4'>
          <div className='min-h-0 w-full overflow-y-auto lg:max-w-md'>
            {section ? (
              <SectionEditor
                section={section}
                values={draft.values[section.id] ?? {}}
                onChange={(key, value) => setValue(section.id, key, value)}
                onBack={() => setOpen(null)}
                onLook={() => {}}
                tools={tools}
              />
            ) : (
              <SectionList
                sections={draft.sections}
                onChange={(sections) => change({ ...draft, sections })}
                onOpen={setOpen}
              />
            )}
          </div>
        </main>

        {(dirty || stage.name !== 'resting') && (
          <SaveBar dirty={dirty} stage={stage} onSave={() => void save()} onCancel={cancel} />
        )}
      </div>
    </TooltipProvider>
  )
}
