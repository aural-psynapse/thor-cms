# thor-cms

Reader: the agent that builds this repo, and the agent that later copies it into a website.

## Problem Statement

A site owner who is not a developer wants to change the words, pictures, videos and links on their own website, reorder its sections, switch one off, and see how many people came. Today that panel exists once, inside one site, tied to that site's database, file host and framework. Every new site means writing the panel again.

## Solution

One working admin panel in this repo, running on fake data. An agent copies it into any website, writes a short list of that site's editable fields, and writes the small pieces that talk to that site's storage. The panel draws itself from the field list. It never knows what framework the site uses or where the content is kept.

## User Stories

1. As a site owner, I want to see every section of my site as a list, so that I know what is on the page.
2. As a site owner, I want to drag a section up or down, so that the page shows it in the order I choose.
3. As a site owner, I want to switch a section off, so that it leaves the site without being deleted.
4. As a site owner, I want some sections fixed in place, like the top bar and the footer, so that I cannot break the page by moving them.
5. As a site owner, I want to click a section and see its boxes, so that I can change the words in it.
6. As a site owner, I want a one-line box for short words and a bigger box for paragraphs, so that each fits what I type.
7. As a site owner, I want to drop a picture on a picture box, so that I can swap a photo without a file dialog.
8. As a site owner, I want the picture box to tell me in one plain sentence why it refused a file, so that I can pick a better one.
9. As a site owner, I want to drag a picture inside its box to choose which part is kept, so that faces are not cut off.
10. As a site owner, I want the picture to be shrunk in my browser before it goes up, so that a phone photo does not take minutes.
11. As a site owner, I want a progress bar while a picture or video goes up, so that I know something is happening.
12. As a site owner, I want to pick a video file and have it checked for type, size and shape, so that the site only gets videos it can play.
13. As a site owner, I want a list of items with a thumbnail, a name and a tag, so that I can manage products, team members or examples.
14. As a site owner, I want to drag items to reorder them, so that the best one comes first.
15. As a site owner, I want folders for items, with rename, reorder and delete, so that items are grouped the way the page shows them.
16. As a site owner, I want to move an item from one folder to another, so that I do not re-upload it.
17. As a site owner, I want a list of my social accounts with the platform's own icon, so that I see at a glance which is which.
18. As a site owner, I want the link box to tell me when a link is not a link, so that the site never has a dead one.
19. As a site owner, I want a bar at the bottom that appears when something is unsaved, with Save and Cancel, so that I never lose a change by accident.
20. As a site owner, I want to be asked before removing anything, so that one slip does not delete my work.
21. As a site owner, I want a live preview of the site beside the boxes, so that I see the change before I save.
22. As a site owner, I want the preview to jump to the thing I am editing, so that I do not scroll to find it.
23. As a site owner, I want the preview at phone size and at laptop size, so that I check both.
24. As a site owner, I want to know when my saved change is on the live site, so that I do not refresh and wonder.
25. As a site owner, I want a numbers page with visits, plays, countries and what people pressed, so that I know how the site does.
26. As a site owner, I want to choose 7, 30 or 90 days on the numbers page, so that I compare periods.
27. As a site owner, I want a "Fields" page where I can add, rename, retype or remove a field, so that a field the agent got wrong does not need the agent again.
28. As a site owner, I want every button with only an icon to say what it does when I rest on it, so that I never guess.
29. As a site owner, I want green for "put on the site", red for "take off", grey for everything else, so that colour tells me what a button does.
30. As a site owner, I want the panel to work on my phone, so that I can fix a typo from anywhere.
31. As an agent wiring a site, I want one `AGENTS.md` that says what to copy and what to write, so that I finish without reading the whole panel.
32. As an agent wiring a site, I want the panel to run here on fake data with `npm run dev`, so that I see every piece working before I touch it.
33. As an agent wiring a site, I want a single field list file that drives the whole panel, so that I describe the site once.
34. As an agent wiring a site, I want field types for short text, long text, picture, row of pictures, video, list of items, list of links, and a custom slot, so that any site fits.
35. As an agent wiring a site, I want a picture rule per field (types, shape, smallest size), so that the panel refuses bad files before they go anywhere.
36. As an agent wiring a site, I want one place to put the code that loads and saves content, so that git repo, database or anything else is my choice.
37. As an agent wiring a site, I want one place to put the code that stores pictures and videos, so that repo, Bunny, R2 or anything else is my choice.
38. As an agent wiring a site, I want one place to put the code that fetches the numbers, so that any analytics source works.
39. As an agent wiring a site, I want one place to put the code that tells the preview which site to show and how to send it live changes, so that any framework works.
40. As an agent wiring a site, I want the panel to build to plain static files, so that I drop them into any site's output at `/admin`.
41. As an agent wiring a site, I want the custom field slot to receive value, onChange and disabled, so that a field the list cannot describe still fits.
42. As an agent wiring a site, I want the field list to be editable from inside the panel and saved through the same content code, so that the owner's fixes persist.
43. As an agent building this repo, I want every exported type named and documented, so that hovering a name explains it.
44. As an agent building this repo, I want tests on the pure helpers and on the pieces with real behaviour, so that a change that breaks dragging or refusing a file fails loudly.
45. As an agent building this repo, I want no file to mention the site the code came from, so that nothing leaks.

## Implementation Decisions

- The repo is one Vite + React application. `npm install && npm run dev` runs it on fake data. `npm run build` produces static files that serve from `/admin` on any host.
- No install command, no component registry, no hosted site. An agent clones this repo and copies the application folder into the target site.
- `AGENTS.md` at the repo root tells the wiring agent what to copy, what to write, and what the site must provide. It names as requirements, per site: the content code, the files code, the numbers code, the preview code, login, and picture and video size limits. None of those ship here beyond the fake versions.
- One field list file drives the panel. It lists sections in page order. Each section has an id, a label, flags for fixed and locked, and fields. Each field has a key, a label and a type. Types in v1: short text, long text, picture, row of pictures, video, list of items, list of links, custom. A picture field carries a rule: accepted types, shape, smallest size. A custom field carries a render function receiving value, onChange and disabled.
- The panel reads the field list at start and draws the left menu, the editor pane and the save bar from it. No section or field is hard-coded.
- The "Fields" page edits the field list. It supports add, rename, change type, reorder and remove. Changes save through the content code like any other content.
- Four slots, each a small typed interface the agent fills per site. Shipped versions are in-memory fakes:
  - content: load the whole content, save the whole content, say when the saved version is live.
  - files: take a picture or video blob, report progress, return a URL.
  - numbers: given a day count, return visits by day, plays, countries, sources, taps, stays.
  - preview: the URL to frame, and a way to push the current unsaved content and the field being edited into that frame.
- Every component is controlled. It takes data as props and reports change through callbacks. It never fetches, writes or uploads. Upload is a callback the component receives.
- Picture rules, shrinking and cropping run in the browser before the files code is called.
- Video upload stays video-specific: pick, check type, size and shape, then hand the file to the files code, which may be resumable.
- The numbers page takes section labels, platform labels and icons from the field list and the links field, never from constants.
- Names follow the general case: Item not Reel, Collection not Group, MediaField not PictureCard, LinkList not AccountList, AnalyticsBoard not VisitorsBoard, Panel not SiteEditor.
- Styling: Tailwind v4 and shadcn pieces inside the panel app only. The host site's CSS is untouched because the panel is its own page.
- TypeScript strict. No `any`. No default exports. Every exported prop type named and exported. Plain English comments that say why, in the voice the source uses.
- Source is copied from the existing panel and generalised. The source does not change. Drift between the two is accepted.

## Testing Decisions

- A good test drives the panel the way the owner does and checks what appears on screen. It never reads component state or calls internals.
- Test points, highest first:
  1. The whole panel mounted with a field list and the fake slots. Tests: sections render from the list, dragging reorders, switching off marks a section, editing a box enables the save bar, Save calls the content code with the new content, Cancel restores, the "Fields" page adds a field and the editor shows it.
  2. Each slot interface tested through the panel with a fake that records calls. Tests: files code receives the shrunk blob and progress reaches the bar, a refused file never reaches the files code, the numbers page draws what the numbers code returns.
  3. Pure helpers with unit tests: picture rules, cropping and shrinking maths, item ordering and moving between folders, link checking, joining visits and plays by day.
- Tools: vitest, @testing-library/react, jsdom. Same as the source repo.
- Prior art: the source repo's suite. Tests of generic logic move across. Tests that assert site-specific words do not.

## Out of Scope

- Real content, files, numbers or preview code for any site. Each site's agent writes those.
- Login and token handling. Named as a requirement in `AGENTS.md`.
- Any database, file host, or backend code.
- Picture and video size limits for a given site. The agent sets the rules per field.
- An install command or a component registry.
- Translation of the panel's own words. Strings are constants the agent edits.
- Wiring into Virtusolar. Separate task after this repo is done.

## Further Notes

- The shape copies how Payload CMS, Directus and Strapi stay storage-agnostic: a field config draws the admin, and swappable pieces talk to storage. Framework independence copies Decap and Sveltia: the admin is its own static page at `/admin`.
- The source panel is used daily by a non-developer. Its wording, colours and refusal messages were shaped by that use and move across unchanged where they are not site-specific.
