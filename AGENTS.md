# Wiring the panel into a site

Read this when you are putting this admin panel on a website. You do not need to read the panel's own code.

The panel is one page. It is built to plain files that go in the site's output at `/admin`. It never knows the site's framework. It reads and writes everything through four small pieces of code that you write for each site.

## 1. See it work first

```bash
npm install
npm run dev
```

Open the address `npm run dev` prints, ending in `/admin/` (usually `http://localhost:5173/admin/`). Everything runs on fake data in memory. Edit a box, press Save, open Numbers and Fields. Do this before you change anything.

## 2. Copy the panel

Copy this whole repo into the site as its own folder, for example `admin-panel/`. Keep it a separate app with its own `package.json`. Do not merge it into the site's own build.

Do not edit these, so later fixes can be copied over them:

- `src/panel/` (the panel)
- `src/components/ui/` and `src/lib/utils.ts` (its buttons and boxes)
- `src/index.css`

You edit only these:

- `src/fields.tsx`
- `src/slots/content.ts`, `files.ts`, `numbers.ts`, `preview.ts`
- `src/slots/index.ts`

Delete `src/demo/` and its two lines in `src/main.tsx` once the site's own preview works.

## 3. Write the field list

Replace `src/fields.tsx`. List every section of the page, top to bottom:

- `id`: a short name the content is saved under. Never change it after the site goes live.
- `label`: what the owner reads.
- `fixed: true` for sections that never move or switch off, like the top bar and the footer.
- `locked: true` for sections with nothing to change. They do not open.
- `fields`: the boxes, each with `key`, `label` and `type`.

Types: `text`, `longText`, `picture`, `pictures`, `video`, `items`, `links`, `custom`.

- `picture`, `pictures` and `items` need a `rule`. Use `SQUARE`, `WIDE`, `PORTRAIT` or `UPRIGHT_OR_WIDE` from `src/panel/lib/picture-rules.ts`, or write one with `pictureRule(shape, smallest, drawnWide)`. Set `drawnWide` to how wide the site draws that picture on a laptop.
- `video` needs a `rule`. Use `VIDEO` from `src/panel/lib/video-check.ts`, or write your own `{ types, biggestMb, least }`.
- `links` may list its own `platforms`. Without it the box offers Instagram, TikTok, YouTube, Facebook, X, LinkedIn, Pinterest, Threads and Website.
- `custom` takes a `render({ value, onChange, disabled })`. Use it only when no other type fits. The value must be plain JSON.

Once the owner saves, the saved field list wins over this file. If you change this file after that, also change the saved content, or clear its `sections` so the panel starts again from this file.

## 4. Write the four slots

The types are in `src/panel/slots.ts`. Each fake in `src/slots/` shows the shape. Replace each one.

### Content: `src/slots/content.ts`

- `load()` returns the saved content, or `null` when nothing is saved yet.
- `save(content)` stores the whole content and returns `{ version }`, a number that goes up with every save.
- `isLive(version)` returns `true` once the live site shows that version or a later one.

The content is one JSON object: `{ sections, values }`. `values[sectionId][key]` holds each box. Keep it wherever suits the site: a JSON file committed to its git repo, a database row, a headless store. The site's build must read the same object to draw its pages.

A common way to answer `isLive`: write the version into a file such as `/version.txt` on every build, and compare.

### Files: `src/slots/files.ts`

- `upload(blob, { name, kind, onProgress })` stores a picture or a video, calls `onProgress` with 0 to 1 as it goes, and returns the address it can be read from.

Pictures arrive already cut and shrunk to webp, 2000 pixels on the long side at most. Videos arrive as picked. Send big videos in pieces so a dropped connection does not start again from zero.

### Numbers: `src/slots/numbers.ts`

- `load(days)` returns the `Numbers` object from `src/panel/lib/numbers.ts` for the last 7, 30 or 90 days.
- Set `ready: false` when the site counts nothing yet. The page says so.
- `taps` name links by their `id` in a links box. `stays` name sections by their `id`. The page finds the names and marks itself.
- Leave a list empty when the site does not count that thing.

### Preview: `src/slots/preview.ts`

- `url` is a page on the site that can draw unsaved content. The panel shows it in a frame beside the boxes.
- `push(frame, { content, focus })` sends that page the content and the box being edited. Use `frame.postMessage` with the site's own address as the target.
- The page must post `{ thorPreview: 'ready' }` to its parent once it listens. The panel then sends the latest content.
- On `focus`, the page should scroll to that section, or to that box when `focus.field` is set.

If the site cannot draw unsaved content, point `url` at the live site and make `push` do nothing.

## 5. Put it behind a login

The panel has no login. The site must stop anyone else reaching `/admin` and the code your slots call. Use what the host offers, for example a login page in front of `/admin`, or a password your server checks. Keep every key and token on the server. Never put one in the slots' browser code.

## 6. Set the size limits

Decide per site how big a picture and a video may be, and set them in the rules in `src/fields.tsx`. The panel refuses anything outside the rules before it reaches your files code. Your storage may still have its own limit; keep the rules inside it.

## 6b. Set the panel's language

Every word the panel itself shows sits in `src/panel/words.ts`. To put the panel in another language, translate that one file and set its `locale`. Change no other file for this, so a later copy of the panel's code keeps the translation when you carry `words.ts` across.

## 7. Build and copy

```bash
npm run build
npm run check:admin
```

`npm run build` writes plain files to `dist/`. Copy `dist/` into the site's output as `/admin/`. `npm run check:admin` serves `dist/` at `/admin` from a plain server, loads every file, and stops the server.

To serve the panel somewhere other than `/admin`, change `base` in `vite.config.ts`.

## What the site must provide

- A page or file the content slot can read and write.
- A place for pictures and videos, with addresses the site can show.
- Something that counts visits, if the Numbers page should show anything.
- A page that draws unsaved content, if the preview should show changes before Save.
- A login in front of `/admin`.

## Before you hand it over

- `npm test`, `npx tsc --noEmit` and `npm run build` pass.
- Every section of the site is in the field list, in page order.
- Save, then check the change reaches the live site and the panel says so.
- Replace a picture and a video once each.
- Open the panel on a phone.
