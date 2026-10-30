// Moving a section up or down the page. Fixed sections, like the top bar and
// the footer, keep their place; only the others trade places among themselves.

/** Anything with an id that may be held in place. */
export type Placeable = { id: string; fixed?: boolean }

/** Moves one item of a list from one place to another. */
export function arrayMove<T>(list: T[], from: number, to: number): T[] {
  const next = [...list]
  const [moved] = next.splice(from, 1)
  if (moved === undefined) return list
  next.splice(to, 0, moved)
  return next
}

/**
 * Puts the section `fromId` where `toId` is, leaving every fixed section in
 * its place. A move onto or from a fixed section changes nothing.
 */
export function moveSection<T extends Placeable>(
  sections: T[],
  fromId: string,
  toId: string,
): T[] {
  const movable = sections.filter((s) => !s.fixed)
  const from = movable.findIndex((s) => s.id === fromId)
  const to = movable.findIndex((s) => s.id === toId)
  if (from < 0 || to < 0 || from === to) return sections
  const moved = arrayMove(movable, from, to)
  let next = 0
  return sections.map((s) => (s.fixed ? s : (moved[next++] ?? s)))
}
