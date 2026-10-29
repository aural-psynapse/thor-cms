# thor-cms

Admin panel components for content-driven sites. You copy the source into your project with the shadcn CLI, then wire it to whatever backend you already have.

## What this is

A set of React components for building the screen a non-technical person uses to edit a website: reorder the sections, switch one off, swap a photo, upload a video, manage a list of links, watch the numbers.

The components are extracted from a working portfolio site's admin panel. They are already used daily by someone who is not a developer, which is where the design decisions came from.

## What this is not

- Not a backend. No database, no file storage, no API routes, no auth.
- Not a hosted service.
- Not an npm dependency. The source lands in your repo and you own it.

## Distribution

A shadcn registry. Someone installs one piece at a time:

```
npx shadcn@latest add https://thor-cms.pages.dev/r/item-list.json
```

The registry is served from a Cloudflare Pages site built out of this repo, so the install URL never changes. Each registry item declares its own dependencies (`@dnd-kit/*`, `lucide-react`, the shadcn primitives it needs) and the CLI pulls those in.

Consumers need Tailwind v4 and shadcn already set up. That is stated in the README as the only prerequisite.

## Repo layout

```
registry/
  thor/
    item-list/          one folder per registry item
    collection-list/
    section-list/
    media-field/
    video-upload/
    link-list/
    panel-shell/
    analytics-board/
    ...
  lib/                  shared helpers, also registry items
apps/
  demo/                 Next.js app, every component wired to fake data
apps/
  docs/                 the Cloudflare Pages site that serves /r/*.json
registry.json           the index the CLI reads
```

`apps/demo` and `apps/docs` may be the same Next.js app. Decide during build; one app is simpler and the demo is the best documentation anyway.

## The two layers

### Layer 1: components

Every component is controlled. It takes its data as props and reports changes through callbacks. It never fetches, never writes, never uploads.

That rule has one consequence worth stating plainly: `PictureCard` today calls the upload endpoint itself and `MetaEditor`/`SiteEditor` fetch their own data. Both must be turned inside out before they ship. The upload becomes `onPick(file) => Promise<string>` supplied by the consumer, so the component shows progress and errors without knowing where bytes go.

### Layer 2: the configured panel

`<ThorPanel>` takes a config describing the sections and the fields in each one, and renders the whole left menu, drag ordering, on/off switches, editor pane and save bar.

```ts
const sections: SectionConfig[] = [
  { id: 'header', label: 'Header', fixed: true, locked: true },
  {
    id: 'hero',
    label: 'Photo and name',
    fields: [
      { type: 'text', key: 'tagline', label: 'Small line above the name' },
      { type: 'text', key: 'name', label: 'Name, big' },
      { type: 'longText', key: 'intro', label: 'Intro paragraph' },
      { type: 'media', key: 'photo', label: 'Your photo', rule: PORTRAIT },
    ],
  },
  {
    id: 'work',
    label: 'Examples',
    fields: [{ type: 'collection', key: 'examples', itemLabel: 'Example' }],
  },
  {
    id: 'contact',
    label: 'Get in touch',
    fields: [
      { type: 'text', key: 'email', label: 'Email address', validate: isEmail },
      { type: 'links', key: 'accounts', label: 'Social accounts' },
      { type: 'custom', key: 'hours', render: (p) => <OpeningHours {...p} /> },
    ],
  },
]
```

Field types in v1: `text`, `longText`, `media`, `mediaRow`, `collection`, `links`, `custom`. `custom` receives `{ value, onChange, disabled }` and returns anything, so the config can never trap someone.

`<ThorPanel>` is itself built out of Layer 1 pieces and has no privileged access. Anyone who outgrows it drops to the components and composes by hand.

## Components in v1

### Editing

| Name | What it does |
|---|---|
| `SectionList` | The bands of a page: drag to reorder, switch on and off, click to open. Some rows fixed in place. |
| `ItemList` | A sortable list of things with a thumbnail, a name, a tag and a folder. Generalised from a list of videos, so it handles products, team members, case studies. |
| `CollectionList` | Folders the items sit in: rename, reorder, delete, with the item count on each. |
| `MediaField` | One picture: shows what is there, lets someone pick a new one, refuses the wrong type or size with a specific message, turns red when it refuses, uploads through a callback with a progress bar. |
| `VideoUpload` | Picks a video file, checks it, hands it to a resumable upload the consumer supplies. Video-specific by design. |
| `LinkList` | A list of accounts: platform, handle, URL, with the URL checked and the platform's own icon in its own colour. |
| `SaveBar` | The strip along the bottom that appears when something is unsaved. |
| `IconButton` | A square icon button with a tooltip, in a neutral, green or destructive tone. |
| `Thumb` | A small square preview that falls back to an icon when there is no picture. |
| `BrandIcon` | Social platform marks from `simple-icons`, each in its own brand colour, falling back to text colour where the mark is black. |

### Shell

| Name | What it does |
|---|---|
| `PanelShell` | Left menu of pages, two-column layout, the header. |
| `PreviewPane` | An iframe pointed at any URL, told which item to highlight, with a check for whether the live site has caught up with the last save. |

### Analytics

| Name | What it does |
|---|---|
| `AnalyticsBoard` | The whole numbers page, fed plain arrays as props. |
| `VisitsBars`, `VisitsAgainstPlays` | Recharts charts over `{ date, visits, plays }`. |
| `CountryFlag` | A country name in, its flag out. |

The analytics pieces must lose every hardcoded reference to the original site's sections and platforms. Labels and icons come in as props.

### Helpers

| Name | What it does |
|---|---|
| `picture-rules` | Describes what a slot accepts (types, shape, minimum size) and produces one plain sentence saying what is wrong with a rejected file. Ships with square, wide, portrait and 9:16-or-16:9 rules, plus a way to write your own. |
| `shrink-picture` | Resizes a picture in the browser before upload. |
| `item-order` | Reordering and moving items between folders. |
| `use-panel-query` | A thin TanStack Query wrapper with the read/save/invalidate pattern. Optional; every component works without it. |

## Naming

Names come from the general case, not the site this was pulled out of.

| Was | Becomes |
|---|---|
| `Reel` | `Item` |
| `Group` | `Collection` |
| `PictureCard` | `MediaField` |
| `AccountList` | `LinkList` |
| `VisitorsBoard` | `AnalyticsBoard` |
| "the Editor" (a person) | "the editor" (whoever uses the panel) |
| `SiteEditor` | `ThorPanel` |

`VideoUpload` keeps its name. Resumable video upload is genuinely video-specific and pretending otherwise would be a worse name.

## The demo app

`apps/demo` is a Next.js app holding a fake site and its panel. Every component appears, wired to in-memory data: fake uploads that resolve after a delay, fake analytics numbers, a preview iframe pointing at the fake site.

It is how the work gets reviewed, and it is the example in the README. It runs with `npm run dev` and needs no keys, no database and no network.

## Code style

- TypeScript, strict. Every exported prop type named and exported.
- JSDoc on every export, so hovering the name in an editor explains it.
- Plain English comments inside, explaining why a decision was made, in the voice the original code uses. No comments restating what the line does.
- Components take `className` and merge it, so the look is the consumer's.
- No `any`. No default exports.

## Testing

`vitest` for the pure helpers: picture rules, ordering, link checking, the analytics maths. `@testing-library/react` for the pieces with real behaviour: drag ordering, refusing a wrong file, clearing an error when the user navigates away.

The source these components come from has a passing suite already. The tests covering generic logic move across; the ones asserting site-specific copy do not.

## Out of scope for v1

- Any backend, database or storage adapter.
- Auth or user management.
- A CLI that generates a project.
- i18n. Strings are props or constants a consumer edits.

## Extraction, not refactor

thor-cms copies source and generalises it. It carries no dependency on where the code came from, and nothing there changes.

The cost is drift: the two copies diverge from the day this is published. That is the trade for shipping without touching running code.

## Done means

1. `npx shadcn@latest add` from the public URL puts a working component into a fresh Next.js + Tailwind v4 + shadcn project.
2. The demo app runs from a clean clone with `npm install && npm run dev`, and every component on this list is reachable and usable in it.
3. `ThorPanel` renders a panel from a config with no site-specific code.
4. No file in the repo mentions the site it was extracted from.
5. README shows the install command and a config that produces a working panel.
