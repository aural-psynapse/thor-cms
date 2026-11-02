// One box drawn over the page around the edited words, pinned to the screen
// so no parent can clip it and it never stretches the page. It fades out on
// its own after a moment, and follows the words while the page scrolls.

const SHOWN_MS = 1500

let box: HTMLDivElement | null = null
let marked: Element | null = null
let fade = 0

function place() {
  if (!box || !marked) return
  // Words are measured by their letters, not their box, so the frame hugs them.
  let r = marked.getBoundingClientRect()
  if (marked.tagName !== 'IMG' && marked.tagName !== 'VIDEO') {
    const range = document.createRange()
    range.selectNodeContents(marked)
    const words = range.getBoundingClientRect()
    if (words.width > 0) r = words
  }
  box.style.left = `${r.left - 6}px`
  box.style.top = `${r.top - 4}px`
  box.style.width = `${r.width + 12}px`
  box.style.height = `${r.height + 8}px`
}

/** Opens whatever closed row holds the element, so the frame has something to show. */
export function openAround(el: Element) {
  for (let up = el.parentElement; up; up = up.parentElement) {
    if (up instanceof HTMLDetailsElement && !up.open) up.open = true
  }
}

/** Frames the element's words for a moment. */
export function frame(el: Element) {
  if (!box) {
    box = document.createElement('div')
    box.setAttribute('aria-hidden', 'true')
    box.dataset.lookFrame = ''
    box.style.cssText =
      'position:fixed;pointer-events:none;z-index:2147483647;border:2px solid #10b981;border-radius:6px;box-shadow:0 0 0 4px rgb(16 185 129 / .25);opacity:0'
    document.body.appendChild(box)
    addEventListener('scroll', place, { passive: true })
    addEventListener('resize', place)
  }
  marked = el
  place()
  box.style.transition = 'none'
  box.style.opacity = '1'
  void box.offsetWidth
  box.style.transition = 'opacity .6s ease'
  clearTimeout(fade)
  fade = window.setTimeout(() => {
    if (box) box.style.opacity = '0'
    marked = null
  }, SHOWN_MS)
}
