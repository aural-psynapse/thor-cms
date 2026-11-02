# Wiring the panel into a site

Read this when you are putting this admin panel on a website. You do not need to read the panel's own code.

The panel is one page. It is built to plain files that go in the site's output at `/admin`. It never knows the site's framework. It reads and writes everything through four small pieces of code that you write for each site.

## 0. Ask the owner first

Before you write a line, ask the owner and write the answers down:

- Where does content get saved? A JSON file in the site's git repo, a database row, a headless store.
- Where do pictures and videos go?
- What counts visits, if anything? Without it, leave out the Analytics page.
- How does the owner log in?
- Which language should the panel speak?
- Does the site's design draw whatever boxes exist, or a fixed set? Only the first needs the Fields page.
- Which pages should the owner see: Content, Settings, Analytics, Fields?

## 1. See it work first

```bash
npm install
npm run dev
```

Open the address `npm run dev` prints, ending in `/admin/` (usually `http://localhost:5173/admin/`). Everything runs on fake data in memory. Edit a box, press Save, open Analytics. Do this before you change anything.

## 2. Copy the panel

From this repo, copy it into the site as its own folder:

```bash
rsync -a --exclude .git --exclude node_modules --exclude dist --exclude .scratch --exclude .playwright-mcp --exclude .serena --exclude .claude --exclude .mcp.json ./ ../site/admin-panel/
```

Keep it a separate app with its own `package.json`. Do not merge it into the site's own build.

Do not edit these, so later fixes can be copied over them:

- `src/panel/` (the panel), except `src/panel/words.ts`
- `src/components/ui/`, `src/hooks/` and `src/lib/utils.ts` (its buttons and boxes)
- `src/index.css`

You edit only these:

- `src/fields.tsx`
- `src/slots/content.ts`, `files.ts`, `numbers.ts`, `preview.ts`
- `src/slots/index.ts`
- `src/main.tsx`, for the `Panel` props
- `src/panel/words.ts`, to translate

Delete `src/demo/` and its two lines in `src/main.tsx` once the site's own preview works.

## 3. Write the field list

Walk the live page top to bottom, on a phone and on a laptop, before you write the list. Note every text and every picture a visitor sees, logos included.

Then replace `src/fields.tsx`:

- Sections follow the page top to bottom.
- Inside a section, boxes follow the order a phone visitor meets them.
- One box per place on the page. The footer email and the menu email are two boxes, never one box feeding both.
- Every picture a visitor sees gets a box.
- A year that follows the calendar, like the one in "© 2026", stays out of the boxes. The site writes it.

Each section has:

- `id`: a short name the content is saved under. Never change it after the site goes live.
- `label`: what the owner reads.
- `phoneLabel`: the name while the preview shows the phone, when the band looks different there. A phone menu instead of a top bar, say.
- `fixed: true` for sections that never move or switch off, like the top bar and the footer. When no section ever moves, pass `fixedSections` to `Panel` instead.
- `locked: true` for sections with nothing to change. They do not open.
- `page: 'settings'` for what a visitor never sees on the page, like the search engine title and description. It moves to the Settings page. Contact details that show on the page stay boxes in the section where they sit.
- `fields`: the boxes, each with `key`, `label` and `type`. A box may add `phoneLabel`, and `screen: 'phone'` or `screen: 'laptop'` when it shows on one screen only.

Types: `text`, `longText`, `picture`, `pictures`, `video`, `items`, `links`, `custom`.

- `picture`, `pictures` and `items` need a `rule`. Use `SQUARE`, `WIDE`, `PORTRAIT` or `UPRIGHT_OR_WIDE` from `src/panel/lib/picture-rules.ts`, or write one with `pictureRule(shape, smallest, drawnWide)`. Set `drawnWide` to how wide the site draws that picture on a laptop. A logo takes `pictureRule({ kind: 'any' }, smallest, drawnWide)`, and the panel then shows it whole.
- `video` needs a `rule`. Use `VIDEO` from `src/panel/lib/video-check.ts`, or write your own `{ types, biggestMb, least }`.
- `links` may list its own `platforms`. Without it the box offers Instagram, TikTok, YouTube, Facebook, X, LinkedIn, Pinterest, Threads and Website.
- `custom` takes a `render({ value, onChange, disabled })`. Use it only when no other type fits. The value must be plain JSON.

Without the Fields page, this file decides the boxes every time the panel opens. The owner's saved order and switched-off sections carry over. With the Fields page, the owner's saved list wins, and only `page`, `fixed`, `locked`, `phoneLabel` and `screen` still come from this file.

## 4. Write the four slots

Each fake in `src/slots/` shows a working example. Replace each one. Their types:

```ts
type ContentSlot = {
  load: () => Promise<Content | null>
  save: (content: Content) => Promise<{ version: number }>
  isLive: (version: number) => Promise<boolean>
}
type FilesSlot = {
  upload: (file: Blob, options: { name: string; kind: 'picture' | 'video'; onProgress: (fraction: number) => void }) => Promise<string>
}
type NumbersSlot = { load: (days: number) => Promise<Numbers> }
type PreviewSlot = {
  url: string
  push: (frame: Window, update: { content: Content; focus: { section: string; field: string | null } | null }) => void
}
```

### Content: `src/slots/content.ts`

- `load()` returns the saved content. It returns `null` only when storage answered and holds nothing yet.
- When storage cannot be reached or opened, `load()` throws with the real cause, for example "the token cannot open the repo". GitHub answers 404 both for a missing file and for a repo the token cannot see, so check the token can see the repo before reading the file.
- `save(content)` stores the whole content, `sections` and `values` both, and returns `{ version }`, a number that goes up with every save.
- `isLive(version)` returns `true` once the live site shows that version or a later one.

The content is one JSON object: `{ sections, values }`. `values[sectionId][key]` holds each box.

On the site side:

- Read every value through one map file, from the site's own text names to `section.key`. Virtusolar keeps it in `src/content/map.ts`.
- Seed the first content from the text the site already shows, through the same map, so the panel opens full.

The live check: the build writes the saved version number to `/version.txt`. `isLive` reads it fresh every time:

```ts
isLive: async (version) => {
  const answer = await fetch(`/version.txt?t=${Date.now()}`, { cache: 'no-store' })
  if (!answer.ok) return false
  return Number((await answer.text()).trim()) >= version
}
```

### Files: `src/slots/files.ts`

- `upload(blob, { name, kind, onProgress })` stores a picture or a video, calls `onProgress` with 0 to 1 as it goes, and returns the address it can be read from.

Pictures arrive already cut and shrunk to webp, 2000 pixels on the long side at most. Videos arrive as picked. Send big videos in pieces so a dropped connection does not start again from zero.

### Numbers: `src/slots/numbers.ts`

- `load(days)` returns the `Numbers` object from `src/panel/lib/numbers.ts` for the last 7, 30 or 90 days.
- Set `ready: false` when the site counts nothing yet. The page says so.
- `taps` name links by their `id` in a links box. `stays` name sections by their `id`. The page finds the names and marks itself.
- Leave a list empty when the site does not count that thing. A site with no video box shows no video numbers.

### Preview: `src/slots/preview.ts`

- `url` is a page on the site that can draw unsaved content. The panel shows it in a frame beside the boxes.
- `push(frame, { content, focus })` sends that page the content and the box being edited. Use `frame.postMessage` with the site's own address as the target.
- The page must post `{ thorPreview: 'ready' }` to its parent once it listens. The panel then sends the latest content.

On `focus`, the page:

- scrolls to the section, or to the box when `focus.field` is set;
- draws one outline around the edited words, measured with a `Range` around the text, not its parent box. It sits pinned to the screen and fades after about 1.5 seconds;
- first opens whatever hides the target: a closed row, an accordion, the phone menu;
- puts the box's marker on every copy of a text that appears twice on the page, and frames the copy visible on the current screen.

`src/demo/look-frame.ts` does the outline for the demo page.

If the site cannot draw unsaved content, point `url` at the live site and make `push` do nothing.

## 5. Put it behind a login

The panel has no login. The site must stop anyone else reaching `/admin` and the code your slots call. Use what the host offers, for example a login page in front of `/admin`, or a password your server checks. Keep every key and token on the server. Never put one in the slots' browser code.

Never make up, print or store a password yourself. The owner sets it with a command that makes a random one and stores it as a secret. `docs/wiring-cloudflare.md` has that command for Cloudflare.

## 6. Set the size limits

Decide per site how big a picture and a video may be, and set them in the rules in `src/fields.tsx`. The panel refuses anything outside the rules before it reaches your files code. Your storage may still have its own limit; keep the rules inside it.

## 6b. Set the panel's language

Every word the panel itself shows sits in `src/panel/words.ts`. To put the panel in another language, translate that one file and set its `locale`. Change no other file for this, so a later copy of the panel's code keeps the translation when you carry `words.ts` across.

## 6c. Pick the pages the owner sees

By default the menu shows Content, Settings when a section has `page: 'settings'`, and Analytics.

- `pages={['edit', 'settings']}` leaves out Analytics, for a site that counts nothing. Settings still shows only when a section has `page: 'settings'`.
- Add `'fields'` only when the site's design draws whatever boxes exist. On a fixed design, a box the owner adds there never shows on the site.

## 7. Build and copy

```bash
npm run build
npm run check:admin
```

`npm run build` writes plain files to `dist/`. Copy `dist/` into the site's output as `/admin/`. `npm run check:admin` serves `dist/` at `/admin` from a plain server, loads every file, and stops the server.

To serve the panel somewhere other than `/admin`, change `base` in `vite.config.ts`.

## 8. A worked example

`docs/wiring-cloudflare.md` wires one whole site: a static site on a Cloudflare Worker, a password at `/admin`, saves committed to GitHub, pictures in the repo, and the live check. The Virtusolar site was built that way.

## 9. Before you hand it over

Your own end check:

- `npm test`, `npx tsc --noEmit` and `npm run build` pass.
- Load the content through the live `/admin`, save once, and see the change on the live site.
- Upload one picture, confirm storage holds both the picture and the content, then delete the test picture.
- With the Fields page on, rename one box and reload.
- If the site has a video box, replace a video once.
- Open the panel on a phone.
- Say a change is live only after `isLive` passes. Never "live within a minute".

Steps only the owner can take. Number them in your report, each with the link to the host's own help page:

1. Make the storage token.
2. Set the password and the token as secrets, with the one command that makes a random password.
3. Connect the host's builds, push one commit, and wait for `/version.txt` to change.
4. Run one check that loads the content through the live `/admin`. It reports the real cause in one line if anything fails.

Before you call the site done, check three things with the owner:

- Every form on the site sends somewhere.
- The client gets a fresh password, not the one used while building.
- Nothing on the page is frozen that should follow the calendar.

## 10. The handover report and the README

Your last message to the owner states:

- the `/admin` address;
- the user name;
- where the password lives, never the password itself.

Write the site a README for whoever takes it over. It says how to log in (address and user name; the password stays in the password manager, never in the repo), where saves go, the owner-only steps, and how to move the repo and the host account to the client. Virtusolar's `README.md` is the model.
