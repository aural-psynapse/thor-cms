// The field list for this site. Replace it per site: one entry per section of
// the page, top to bottom, with the boxes the owner may change in each.

import type { FieldList } from '@/panel/field-list'
import { PORTRAIT, SQUARE, WIDE } from '@/panel/lib/picture-rules'
import { VIDEO } from '@/panel/lib/video-check'

/** The demo site: a small shop with a welcome, a gallery, products and links. */
export const fieldList: FieldList = [
  {
    id: 'top',
    label: 'Top bar',
    fixed: true,
    fields: [{ key: 'name', label: 'Site name', type: 'text' }],
  },
  {
    id: 'welcome',
    label: 'Welcome',
    fields: [
      { key: 'title', label: 'Heading', type: 'text' },
      { key: 'intro', label: 'A few words about you', type: 'longText' },
      { key: 'photo', label: 'Your photo', type: 'picture', rule: PORTRAIT },
      {
        key: 'accent',
        label: 'Accent colour',
        type: 'custom',
        // A box the list cannot describe: the site draws its own.
        render: ({ value, onChange, disabled }) => (
          <input
            type='color'
            aria-label='Accent colour'
            value={typeof value === 'string' ? value : '#0f766e'}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            className='h-9 w-16 cursor-pointer rounded border'
          />
        ),
      },
    ],
  },
  {
    id: 'banner',
    label: 'Banner',
    fields: [{ key: 'picture', label: 'Banner picture', type: 'picture', rule: WIDE }],
  },
  {
    id: 'gallery',
    label: 'Gallery',
    fields: [{ key: 'pictures', label: 'Pictures', type: 'pictures', rule: SQUARE }],
  },
  {
    id: 'film',
    label: 'Film',
    fields: [{ key: 'video', label: 'Video', type: 'video', rule: VIDEO }],
  },
  {
    id: 'products',
    label: 'Products',
    fields: [{ key: 'list', label: 'Products', type: 'items', rule: SQUARE }],
  },
  {
    id: 'contact',
    label: 'Contact',
    fields: [
      { key: 'email', label: 'Email address', type: 'text' },
      { key: 'links', label: 'Where to find you', type: 'links' },
    ],
  },
  { id: 'footer', label: 'Footer', fixed: true, locked: true, fields: [] },
]
