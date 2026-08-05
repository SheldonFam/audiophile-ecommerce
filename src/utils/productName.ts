/**
 * How a product name is set across lines.
 *
 * The design breaks every product name before its final word — "XX99 Mark II"
 * over "Headphones", "YX1 Wireless" over "Earphones" — at every breakpoint.
 *
 * Wrapping does not produce that. On the category page the copy column is 572
 * at tablet, where all three headphone names fit on one line, and 445 at
 * desktop, where the short names — XX59, ZX7, ZX9 — still do. Only the longest
 * names at the narrowest column happen to break where the design breaks them,
 * so the break has to be stated.
 */

/**
 * Splits a name into everything before its last word, and that last word.
 *
 * `lead` keeps the space that separated them, so a caller can render the two
 * parts adjacently and still have the element's text read as the whole name —
 * which matters, because that text is what an accessible name is built from.
 * A single-word name has no lead.
 */
export function splitBeforeLastWord(name: string): {
  lead: string
  lastWord: string
} {
  const lastSpace = name.lastIndexOf(' ')
  if (lastSpace === -1) return { lead: '', lastWord: name }

  return {
    lead: name.slice(0, lastSpace + 1),
    lastWord: name.slice(lastSpace + 1),
  }
}
