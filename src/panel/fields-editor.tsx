import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AskFirst } from './ask-first'
import { FIELD_TYPES, type Content, type FieldType, type StoredSection } from './field-list'
import { IconButton } from './icon-button'
import { WORDS } from './words'
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
    <div className='max-w-2xl space-y-4'>

      {sections.map((section) => {
        const draft = newBox[section.id] ?? { label: '', type: 'text' as FieldType }
        return (
          <Card key={section.id} data-fields-section={section.id} className='gap-3 p-4'>
            <div className='flex items-center gap-2'>
              <Input
                aria-label={WORDS.fields.sectionName}
                value={section.label}
                className='font-medium'
                onChange={(event) => rename(section.id, null, event.target.value)}
              />
              {!section.fixed && (
                <>
                  <IconButton label={WORDS.fields.moveUp(section.label)} onClick={() => setSections(nudgeSection(sections, section.id, -1))}>
                    <ArrowUp />
                  </IconButton>
                  <IconButton label={WORDS.fields.moveDown(section.label)} onClick={() => setSections(nudgeSection(sections, section.id, 1))}>
                    <ArrowDown />
                  </IconButton>
                  <IconButton label={WORDS.fields.remove(section.label)} onClick={() => setAsking({ section, key: null })}>
                    <Trash2 />
                  </IconButton>
                </>
              )}
            </div>

            {section.fields.map((field) => (
              <div key={field.key} data-fields-box={field.key} className='flex flex-wrap items-center gap-2 ps-4'>
                <Input
                  aria-label={WORDS.fields.boxName}
                  value={field.label}
                  className='min-w-40 flex-1'
                  onChange={(event) => rename(section.id, field.key, event.target.value)}
                />
                <TypePicker
                  label={WORDS.fields.kindOf(field.label)}
                  value={field.type}
                  onChange={(type) => onChange(retypeField(content, section.id, field.key, type))}
                />
                <IconButton label={WORDS.fields.moveUp(field.label)} onClick={() => setSections(nudgeField(sections, section.id, field.key, -1))}>
                  <ArrowUp />
                </IconButton>
                <IconButton label={WORDS.fields.moveDown(field.label)} onClick={() => setSections(nudgeField(sections, section.id, field.key, 1))}>
                  <ArrowDown />
                </IconButton>
                <IconButton label={WORDS.fields.remove(field.label)} onClick={() => setAsking({ section, key: field.key })}>
                  <Trash2 />
                </IconButton>
              </div>
            ))}

            <div className='flex flex-wrap items-center gap-2 ps-4'>
              <Input
                aria-label={WORDS.fields.newBoxIn(section.label)}
                placeholder={WORDS.fields.newBox}
                value={draft.label}
                className='min-w-40 flex-1'
                onChange={(event) =>
                  setNewBox({ ...newBox, [section.id]: { ...draft, label: event.target.value } })
                }
              />
              <TypePicker
                label={WORDS.fields.kindOfNew(section.label)}
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
                <Plus /> {WORDS.fields.addBox}
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
            aria-label={WORDS.fields.newSectionName}
            placeholder={WORDS.fields.newSection}
            value={newSection}
            onChange={(event) => setNewSection(event.target.value)}
          />
          <Button
            type='button'
            variant='outline'
            onClick={() => take('new', addSection(sections, newSection), () => setNewSection(''))}
          >
            <Plus /> {WORDS.fields.addSection}
          </Button>
        </div>
        {problem?.where === 'new' && <p className='text-destructive text-sm'>{problem.text}</p>}
      </Card>

      <AskFirst
        open={asking !== null}
        onOpenChange={(open) => !open && setAsking(null)}
        title={WORDS.fields.removeTitle(askingField?.label ?? asking?.section.label ?? '')}
        action={WORDS.ask.remove}
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
          ? WORDS.fields.removeSectionBody
          : WORDS.fields.removeBoxBody}
      </AskFirst>
    </div>
  )
}
