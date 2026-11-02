# One whole wiring: Cloudflare Worker and GitHub

Reader: the agent putting the panel on a static site. This is one way to answer every question in `AGENTS.md` section 0, the way the Virtusolar site does it (its `src/worker.ts` and `README.md`). It costs nothing on the Cloudflare free plan and needs no database or file storage service.

## How it fits together

- The site builds to plain files in `dist/`. One Cloudflare Worker serves them.
- The panel builds into `dist/admin/`.
- The Worker asks for a password at `/admin` and `/admin/*`, with the browser's own sign-in window (HTTP Basic). Any user name works.
- Behind the password, the Worker answers the panel's calls and talks to GitHub with a token only it holds:

| Call | Does |
| --- | --- |
| `GET /admin/api/content` | Reads the content JSON file from the repo. |
| `PUT /admin/api/content` | Commits the content JSON file with the version raised by one. |
| `POST /admin/api/upload` | Commits a picture to `public/cms/`. |
| `GET /admin/api/numbers` | Reads the visit counts, when the site counts visits. |

- Every save is a commit. Cloudflare's builds see the push, rebuild and deploy.
- The build writes the content's version to `/version.txt`. The panel's `isLive` reads it, as `AGENTS.md` section 4 shows.

## The Worker's settings

`wrangler.jsonc`:

```jsonc
{
  "name": "site-name",
  "main": "src/worker.ts",
  "compatibility_date": "2026-10-23",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "run_worker_first": ["/admin", "/admin/*", "/cms/*", "/api/*"]
  },
  "vars": {
    "GITHUB_REPO": "owner/repo",
    "GITHUB_BRANCH": "main"
  }
}
```

`/cms/*` runs through the Worker so a just-uploaded picture shows before the next build has it as a plain file: the Worker reads it from the repo.

## The Worker's rules

- No `ADMIN_PASSWORD` secret: `/admin` refuses everyone.
- No `GITHUB_TOKEN` secret, or a token that cannot see the repo: `GET /admin/api/content` answers with that cause in words. Never with "file missing".
- The file is missing and the token can see the repo: answer `null`, so the panel starts from the code's field list.

## Steps only the owner can take

Give the owner these, numbered, in your report.

1. **Make a GitHub token** for this repo only. GitHub's page: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token. Repository access: only this repo. Permissions: Contents, read and write.
2. **Set the two secrets** from a checkout of the site. The first line makes a random password, shows it once in the owner's terminal, and stores it:

   ```bash
   LC_ALL=C tr -dc 'A-Za-z2-9' </dev/urandom | head -c 24 | tee /dev/tty | npx wrangler secret put ADMIN_PASSWORD
   npx wrangler secret put GITHUB_TOKEN
   ```

   The owner keeps the password in a password manager.
3. **Connect Workers Builds** so a save rebuilds the site. Cloudflare's page: https://developers.cloudflare.com/workers/ci-cd/builds/. Build command `npm run build`. The Worker name in the dashboard must equal `name` in `wrangler.jsonc`. Then push one commit and wait until `/version.txt` changes.
4. **Check the live panel**: open `/admin`, sign in, and see the content load. If it fails, the panel shows the cause in one line.

## Limits

- Workers free plan: 100,000 requests a day.
- Workers Builds free plan: 3,000 build minutes a month. One build of a small site takes about two minutes, so roughly 1,500 saves a month.
- GitHub keeps every uploaded picture in the repo history forever.
- One person edits at a time. When two save at once, the later save wins.
