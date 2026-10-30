import type { JsonValue, StoredSection } from './field-list'
import { FieldBox, type FieldTools } from './field-box'

/** The sections that are not bands of the page, and their boxes. */
export type SettingsPageProps = {
  sections: StoredSection[]
  values: Record<string, Record<string, JsonValue>>
  onChange: (sectionId: string, key: string, next: JsonValue) => void
  tools: FieldTools
}

/**
 * Every settings section one under another, each with its boxes open. There
 * is nothing to reorder or switch off here, and nothing for the preview to
 * show, so the boxes sit in one column on their own.
 */
export function SettingsPage({ sections, values, onChange, tools }: SettingsPageProps) {
  return (
    <div className='w-full max-w-[460px] space-y-6'>
      {sections.map((section) => (
        <section key={section.id} data-settings={section.id} className='space-y-3'>
          <h2 className='px-1 text-sm font-medium'>{section.label}</h2>
          {section.fields.map((field) => (
            <FieldBox
              key={field.key}
              field={field}
              value={values[section.id]?.[field.key]}
              onChange={(next) => onChange(section.id, field.key, next)}
              onLook={() => {}}
              tools={tools}
            />
          ))}
        </section>
      ))}
    </div>
  )
}
