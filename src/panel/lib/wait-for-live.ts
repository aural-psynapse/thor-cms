// After a save, the panel keeps asking the content code whether the saved
// version is on the live site yet, which is the moment the owner's change is
// there for visitors. It gives up after a while rather than spinning forever.

/** How to ask, how long to wait between asks, and when to give up. */
export type WaitParts = {
  /** True once the saved version is live. A throw counts as "not yet". */
  isLive: () => Promise<boolean>
  pause?: (ms: number) => Promise<void>
  everyMs?: number
  /** Stop after this many asks, so the panel never spins forever. */
  giveUpAfter?: number
}

/** Waits the given time on the browser's clock. */
export function pauseFor(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, ms))
}

/** True once the change is live, false when it gave up waiting. */
export async function waitForLive(parts: WaitParts): Promise<boolean> {
  const { isLive, pause = pauseFor, everyMs = 2000, giveUpAfter = 150 } = parts
  for (let asked = 0; asked < giveUpAfter; asked++) {
    await pause(everyMs)
    // A site in the middle of a rebuild can answer with an error. That means
    // "not yet", never "something is broken".
    const live = await isLive().catch(() => false)
    if (live) return true
  }
  return false
}
