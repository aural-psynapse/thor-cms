import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { JsonValue, StoredSection } from './field-list'
import { FieldBox, type FieldTools } from './field-box'

/** One opened section: its boxes and their values. */
export type SectionEditorProps = {
  section: StoredSection
  values: Record<string, JsonValue>
  onChange: (key: string, next: JsonValue) => void
  /** Back to the list of sections. */
  onBack: () => void
  /** Tells the preview which box is being worked on; null for the section itself. */
  onLook: (key: string | null) => void
  tools: FieldTools
}

/** Every box in one section, top to bottom, in the order the field list gives. */
export function SectionEditor({
  section,
  values,
  onChange,
  onBack,
  onLook,
  tools,
}: SectionEditorProps) {
  return (
    <div className='space-y-3'>
      <div className='flex items-center gap-2'>
        <Button type='button' variant='ghost' size='sm' onClick={onBack}>
          <ArrowLeft /> All sections
        </Button>
      </div>
      <h2 className='px-1 text-lg font-semibold'>{section.label}</h2>

      {section.fields.length === 0 && (
        <p className='text-muted-foreground px-1 text-sm'>Nothing to change here yet.</p>
      )}

      {section.fields.map((field) => (
        <FieldBox
          key={field.key}
          field={field}
          value={values[field.key]}
          onChange={(next) => onChange(field.key, next)}
          onLook={() => onLook(field.key)}
          tools={tools}
        />
      ))}
    </div>
  )
}
