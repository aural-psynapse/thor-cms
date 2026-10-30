import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { waitForLive } from '@/panel/lib/wait-for-live'

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('waiting for a save to reach the live site', () => {
  it('asks every two seconds and says yes once the site has it', async () => {
    const answers = [false, false, true]
    const isLive = vi.fn(async () => answers.shift() ?? false)
    let said: boolean | null = null
    void waitForLive({ isLive }).then((live) => (said = live))

    await vi.advanceTimersByTimeAsync(1999)
    expect(isLive).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(isLive).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(4000)
    expect(said).toBe(true)
    expect(isLive).toHaveBeenCalledTimes(3)
  })

  it('counts an error from a site mid-rebuild as not yet', async () => {
    const isLive = vi
      .fn<() => Promise<boolean>>()
      .mockRejectedValueOnce(new Error('502'))
      .mockResolvedValueOnce(true)
    const waiting = waitForLive({ isLive, everyMs: 1000 })
    await vi.advanceTimersByTimeAsync(2000)
    await expect(waiting).resolves.toBe(true)
  })

  it('gives up after the limit rather than spinning forever', async () => {
    const isLive = vi.fn(async () => false)
    const waiting = waitForLive({ isLive, everyMs: 1000, giveUpAfter: 5 })
    await vi.advanceTimersByTimeAsync(10_000)
    await expect(waiting).resolves.toBe(false)
    expect(isLive).toHaveBeenCalledTimes(5)
  })
})
