import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import type { CustomRender, JsonValue, StoredField } from './field-list'
import { ItemsBox } from './items-box'
import { DEFAULT_PLATFORMS } from './lib/links'
import { readItems, readLinks, readPictures, readText } from './lib/values'
import { LinkList } from './link-list'
import { MediaField } from './media-field'
import { PictureRow } from './picture-row'
import { VideoField } from './video-field'
import type { FilesSlot } from './slots'
import { TextFieldBox } from './text-field'
import { WORDS } from './words'

/** What every box needs from the panel around it. */
export type FieldTools = {
  /** True while a save runs, so nothing changes under it. */
  disabled: boolean
  /** The files code's upload, which picture boxes call once a file is ready. */
  upload: FilesSlot['upload']
  /** Custom renders from the code field list, by key. */
  renders: Map<string, CustomRender>
  /** Videos picked and not yet sent, by the address the preview plays them from. */
  pendingVideos: Map<string, File>
  /** Keeps a picked video until Save, and gives the address to play it from now. */
  holdVideo: (file: File) => string
}

/** One box drawn from its field, with its value. */
export type FieldBoxProps = {
  field: StoredField
  value: JsonValue | undefined
  onChange: (next: JsonValue) => void
  /** Tells the preview which box is being worked on. */
  onLook: () => void
  tools: FieldTools
}

/** Draws the right box for the field's type. */
export function FieldBox({ field, value, onChange, onLook, tools }: FieldBoxProps) {
  switch (field.type) {
    case 'text':
    case 'longText':
      return (
        <TextFieldBox
          label={field.label}
          long={field.type === 'longText'}
          value={readText(value)}
          onChange={onChange}
          onLook={onLook}
          disabled={tools.disabled}
        />
      )
    case 'picture':
      return (
        <MediaField
          label={field.label}
          rule={field.rule}
          url={readText(value)}
          onChange={onChange}
          upload={tools.upload}
          onLook={onLook}
          disabled={tools.disabled}
        />
      )
    case 'pictures':
      return (
        <PictureRow
          label={field.label}
          rule={field.rule}
          urls={readPictures(value)}
          onChange={onChange}
          upload={tools.upload}
          onLook={onLook}
          disabled={tools.disabled}
        />
      )
    case 'video': {
      const url = readText(value)
      const picked = tools.pendingVideos.get(url)
      return (
        <VideoField
          label={field.label}
          rule={field.rule}
          has={url !== '' && !picked}
          pickedName={picked?.name}
          onPick={(file) => onChange(tools.holdVideo(file))}
          onLook={onLook}
          disabled={tools.disabled}
        />
      )
    }
    case 'items':
      return (
        <ItemsBox
          label={field.label}
          rule={field.rule}
          value={readItems(value)}
          onChange={onChange}
          upload={tools.upload}
          onLook={onLook}
          disabled={tools.disabled}
        />
      )
    case 'links':
      return (
        <LinkList
          label={field.label}
          links={readLinks(value)}
          platforms={field.platforms ?? DEFAULT_PLATFORMS}
          onChange={onChange}
          onLook={onLook}
          disabled={tools.disabled}
        />
      )
    case 'custom': {
      const render = tools.renders.get(field.key)
      return (
        <Card className='gap-2 p-4' onFocus={onLook}>
          <Label>{field.label}</Label>
          {render ? (
            render({ value, onChange, disabled: tools.disabled })
          ) : (
            // A custom box added on the Fields page has no code behind it yet.
            <p className='text-muted-foreground text-sm'>{WORDS.sections.needsCode}</p>
          )}
        </Card>
      )
    }
    default:
      return null
  }
}
