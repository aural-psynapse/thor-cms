# thor-cms

An admin panel for a small website. The owner changes words, pictures, videos and links, reorders sections, switches one off, and sees how many people came. The panel works with any site framework and any storage.

## Run it

```bash
npm install
npm run dev
```

Open the address `npm run dev` prints, ending in `/admin/` (usually `http://localhost:5173/admin/`). It runs on fake data in memory and needs no keys or network.

## Build it

```bash
npm run build
npm run check:admin
```

`npm run build` writes plain files to `dist/`, served from `/admin/`. `npm run check:admin` serves them from a plain server and checks every file loads.

## The field list

One list drives the whole panel. Each section names its boxes:

```tsx
export const fieldList: FieldList = [
  { id: 'top', label: 'Top bar', fixed: true, fields: [{ key: 'name', label: 'Site name', type: 'text' }] },
  {
    id: 'welcome',
    label: 'Welcome',
    fields: [
      { key: 'title', label: 'Heading', type: 'text' },
      { key: 'intro', label: 'A few words about you', type: 'longText' },
      { key: 'photo', label: 'Your photo', type: 'picture', rule: PORTRAIT },
    ],
  },
  { id: 'links', label: 'Find us', fields: [{ key: 'accounts', label: 'Accounts', type: 'links' }] },
]
```

Box types: `text`, `longText`, `picture`, `pictures`, `video`, `items`, `links`, `custom`.

The owner can also add, rename and remove boxes on the "Fields" page.

## Putting it on a site

Follow `AGENTS.md`. It lists what to copy and the four pieces of code each site writes: content, files, numbers and preview.

## Tests

```bash
npm test
npm run typecheck
```
