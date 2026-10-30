import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AskFirst } from './ask-first'
import { FIELD_TYPES, type Content, type FieldType, type StoredSection } from './field-list'
import { IconButton } from './icon-button'
import {
  addField,
  addSection,
  nudgeField,
  nudgeSection,
  removeField,
  removeSection,
  retypeField,
  type Added,
} from './lib/field-edit'

/** The Fields page: the field list itself, as the owner can change it. */
export type FieldsEditorProps = {
  content: Content
  onChange: (next: Content) => void
}

const SELECT = 'border-input bg-background h-9 rounded-md border px-2 text-sm'

function TypePicker({ value, onChange, label }: {
  value: FieldType
  onChange: (type: FieldType) => void
  label: string
}) {
  return (
    <select
      aria-label={label}
      className={SELECT}
      value={value}
      onChange={(event) => {
        const picked = FIELD_TYPES.find((t) => t.type === event.target.value)
        if (picked) onChange(picked.type)
      }}
    >
      {FIELD_TYPES.map((t) => (
        <option key={t.type} value={t.type}>
          {t.name}
        </option>
      ))}
    </select>
  )
}

/** Something waiting for "Remove?" to be answered. */
type Asking = { section: StoredSection; key: string | null }

/**
 * Every section and the boxes in it, as the owner can change them: add,
 * rename, change the kind of box, move up and down, remove. A change shows in
 * the editor at once, and saves with Save like any other change.
 */
export function FieldsEditor({ content, onChange }: FieldsEditorProps) {
  const [newBox, setNewBox] = useState<Record<string, { label: string; type: FieldType }>>({})
  const [newSection, setNewSection] = useState('')
  const [problem, setProblem] = useState<{ where: string; text: string } | null>(null)
  const [asking, setAsking] = useState<Asking | null>(null)
  const sections = content.sections

  function setSections(next: StoredSection[]) {
    onChange({ ...content, sections: next })
  }

  function take(where: string, added: Added, after: () => void) {
    if ('problem' in added) {
      setProblem({ where, text: added.problem })
      return
    }
    setProblem(null)
    setSections(added.sections)
    after()
  }

  function rename(sectionId: string, key: string | null, label: string) {
    setSections(
      sections.map((s) => {
        if (s.id !== sectionId) return s
        if (key === null) return { ...s, label }
        return { ...s, fields: s.fields.map((f) => (f.key === key ? { ...f, label } : f)) }
      }),
    )
  }

  const askingField = asking?.key
    ? asking.section.fields.find((f) => f.key === asking.key)
    : undefined

  return (
    <div className='mx-auto max-w-2xl space-y-4'>
      <p className='text-muted-foreground text-sm'>
        The sections of your site and the boxes in each. Changes show in the editor at once and
        go on the site when you save.
      </p>

      {sections.map((section) => {
        const draft = newBox[section.id] ?? { label: '', type: 'text' as FieldType }
        return (
          <Card key={section.id} data-fields-section={section.id} className='gap-3 p-4'>
            <div className='flex items-center gap-2'>
              <Input
                aria-label='Section name'
                value={section.label}
                className='font-medium'
                onChange={(event) => rename(section.id, null, event.target.value)}
              />
              {!section.fixed && (
                <>
                  <IconButton label={`Move ${section.label} up`} onClick={() => setSections(nudgeSection(sections, section.id, -1))}>
                    <ArrowUp />
                  </IconButton>
                  <IconButton label={`Move ${section.label} down`} onClick={() => setSections(nudgeSection(sections, section.id, 1))}>
                    <ArrowDown />
                  </IconButton>
                  <IconButton label={`Remove ${section.label}`} onClick={() => setAsking({ section, key: null })}>
                    <Trash2 />
                  </IconButton>
                </>
              )}
            </div>

            {section.fields.map((field) => (
              <div key={field.key} data-fields-box={field.key} className='flex flex-wrap items-center gap-2 ps-4'>
                <Input
                  aria-label='Box name'
                  value={field.label}
                  className='min-w-40 flex-1'
                  onChange={(event) => rename(section.id, field.key, event.target.value)}
                />
                <TypePicker
                  label={`Kind of box for ${field.label}`}
                  value={field.type}
                  onChange={(type) => onChange(retypeField(content, section.id, field.key, type))}
                />
                <IconButton label={`Move ${field.label} up`} onClick={() => setSections(nudgeField(sections, section.id, field.key, -1))}>
                  <ArrowUp />
                </IconButton>
                <IconButton label={`Move ${field.label} down`} onClick={() => setSections(nudgeField(sections, section.id, field.key, 1))}>
                  <ArrowDown />
                </IconButton>
                <IconButton label={`Remove ${field.label}`} onClick={() => setAsking({ section, key: field.key })}>
                  <Trash2 />
                </IconButton>
              </div>
            ))}

            <div className='flex flex-wrap items-center gap-2 ps-4'>
              <Input
                aria-label={`New box in ${section.label}`}
                placeholder='New box'
                value={draft.label}
                className='min-w-40 flex-1'
                onChange={(event) =>
                  setNewBox({ ...newBox, [section.id]: { ...draft, label: event.target.value } })
                }
              />
              <TypePicker
                label={`Kind of new box in ${section.label}`}
                value={draft.type}
                onChange={(type) => setNewBox({ ...newBox, [section.id]: { ...draft, type } })}
              />
              <Button
                type='button'
                variant='outline'
                onClick={() =>
                  take(section.id, addField(sections, section.id, draft.label, draft.type), () =>
                    setNewBox({ ...newBox, [section.id]: { label: '', type: 'text' } }),
                  )
                }
              >
                <Plus /> Add box
              </Button>
            </div>
            {problem?.where === section.id && (
              <p className='text-destructive ps-4 text-sm'>{problem.text}</p>
            )}
          </Card>
        )
      })}

      <Card className='gap-2 p-4'>
        <div className='flex items-center gap-2'>
          <Input
            aria-label='New section name'
            placeholder='New section'
            value={newSection}
            onChange={(event) => setNewSection(event.target.value)}
          />
          <Button
            type='button'
            variant='outline'
            onClick={() => take('new', addSection(sections, newSection), () => setNewSection(''))}
          >
            <Plus /> Add section
          </Button>
        </div>
        {problem?.where === 'new' && <p className='text-destructive text-sm'>{problem.text}</p>}
      </Card>

      <AskFirst
        open={asking !== null}
        onOpenChange={(open) => !open && setAsking(null)}
        title={`Remove ${askingField?.label ?? asking?.section.label ?? ''}?`}
        action='Remove'
        onConfirm={() => {
          if (asking) {
            onChange(
              asking.key === null
                ? removeSection(content, asking.section.id)
                : removeField(content, asking.section.id, asking.key),
            )
          }
          setAsking(null)
        }}
      >
        {asking?.key === null
          ? 'The section and everything in it come off the site when you save.'
          : 'The box and what is in it come off the site when you save.'}
      </AskFirst>
    </div>
  )
}
