// Proves the built panel works from /admin on a plain static server: the files
// in dist/ are served under /admin/, exactly as a site would after copying
// them into its own output. The server is closed before the script ends.
//
//   npm run build && npm run check:admin

import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const DIST = join(import.meta.dirname, '..', 'dist')
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }

const server = createServer(async (req, res) => {
  const path = new URL(req.url ?? '/', 'http://x').pathname
  if (!path.startsWith('/admin/')) {
    res.writeHead(404).end()
    return
  }
  const inside = normalize(path.slice('/admin/'.length) || 'index.html')
  try {
    const body = await readFile(join(DIST, inside.endsWith('/') ? `${inside}index.html` : inside))
    res.writeHead(200, { 'content-type': TYPES[extname(inside)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404).end()
  }
})

await new Promise((done) => server.listen(0, '127.0.0.1', done))
const address = server.address()
const base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`

let failed = false
async function expectOk(path) {
  const answer = await fetch(base + path)
  console.log(`${answer.status} ${path}`)
  if (!answer.ok) failed = true
  return answer.ok ? answer.text() : ''
}

try {
  const page = await expectOk('/admin/')
  await expectOk('/admin/?preview')
  // every file the page asks for must be under /admin/ and must load
  const asked = [...page.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map((m) => m[1])
  if (asked.length === 0) failed = true
  for (const path of asked) {
    if (!path.startsWith('/admin/')) {
      console.log(`outside /admin/: ${path}`)
      failed = true
    }
    await expectOk(path)
  }
} finally {
  server.close()
}

console.log(failed ? 'FAILED: the build does not serve from /admin' : 'OK: the build serves from /admin')
process.exit(failed ? 1 : 0)
