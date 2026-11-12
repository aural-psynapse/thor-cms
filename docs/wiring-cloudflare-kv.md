# One whole wiring: Cloudflare KV, R2 and Access

Reader: the agent putting the panel on a site that runs on a Cloudflare Worker and must show a saved change at once, with no rebuild. The SWA site is built this way (its `website/src/lib/store.ts`, `website/src/lib/access.ts`, `website/src/middleware.ts` and `website/src/pages/admin/api/`). For the GitHub-commit way, read `docs/wiring-cloudflare.md`.

## How it fits together

- The site renders on the Worker and reads its content from KV on every visit.
- The panel builds into the site's `/admin/`.
- Cloudflare Access guards `/admin` and `/admin/api/*`. A person types their email, gets a code, and logs in. Only listed emails get a code.
- The Worker checks the Access token on every `/admin/api` call itself too, so a wrong Access path still lets nobody in. Local runs skip the check.

| Call | Does |
| --- | --- |
| `GET /admin/api/content` | Reads the content and its version from KV. |
| `PUT /admin/api/content` | Writes the content to KV and raises the version by one. `isLive` compares versions. |
| `POST /admin/api/upload` | Puts a picture or video in R2. The site serves it from `/media/<key>`. |
| `GET /admin/api/numbers` | Reads visit counts from Workers Analytics Engine through Cloudflare's SQL API. |
| `GET/PUT /admin/api/referrals` | Reads and saves the referral list in KV. |

- A visit through a referral address (`/<path>`) records the visit and opens the home page.
- Named referral visits sit in KV with a 12-month expiry. Anonymous counts go to Analytics Engine.

## The Worker's settings

In `wrangler.jsonc`:

- `kv_namespaces`: one binding for content, referrals and named visits.
- `r2_buckets`: one binding for uploads.
- `analytics_engine_datasets`: one binding for visit counts.
- `vars.ACCESS_TEAM_DOMAIN`: the Access team address, `<team>.cloudflareaccess.com`.
- `vars.CF_ACCOUNT_ID`: the account the counts are read from.

Secrets, set with `npx wrangler secret put <NAME>`:

- `ACCESS_AUD`: the Access application's audience tag.
- `CF_ANALYTICS_TOKEN`: an API token with "Account Analytics Read" only.

## Steps only the owner can take

List these to the owner right after the answers to `AGENTS.md` section 0, before you build. The owner does them while you build.

1. Turn on R2 in the Cloudflare dashboard. Cloudflare asks for a card and calls it a subscription. It charges nothing under 10 GB a month. Tell the owner this before they see the card form. [R2 docs](https://developers.cloudflare.com/r2/get-started/)
2. Set up Zero Trust and an Access application on `<site>/admin`, with one rule allowing the listed emails and the "One-time PIN" login. [Access docs](https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-public-app/)
3. Check the Zero Trust team name and the organization name. Both cover the whole Cloudflare account and show on every login page. An account used for another project may show that project's name to the client.
4. Make the API token with "Account Analytics Read" and put it in as `CF_ANALYTICS_TOKEN`. [API token docs](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)

## Limits

On the free plan: KV allows 100,000 reads and 1,000 writes a day, R2 holds 10 GB, Analytics Engine takes 100,000 events a day. A site that passes 100,000 visits a day needs the 5 USD Workers plan.
