import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)

// jsdom has no layout, so these browser pieces the panel leans on are stood in
// for with ones that do nothing.
class StillObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver ??= StillObserver
Element.prototype.scrollIntoView ??= function scrollIntoView(): void {}
Element.prototype.hasPointerCapture ??= function hasPointerCapture(): boolean {
  return false
}
URL.createObjectURL ??= (): string => 'blob:picked'
URL.revokeObjectURL ??= (): void => {}
// a laptop-wide window that never matches a media query
window.matchMedia ??= (query: string): MediaQueryList =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  }) as MediaQueryList
