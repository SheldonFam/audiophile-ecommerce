import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import { BREAKPOINTS } from './ResponsiveImage'

/**
 * The spec lists this component under "not tested", and for its markup that is
 * right — jsdom never evaluates `<picture>` or `media`, so a rendering test
 * could only assert the component's own literals back out.
 *
 * What is worth testing is the one thing the component exists to guarantee:
 * that images change crop at exactly the widths the layout changes at. That is
 * a relationship between this file and Tailwind's theme, it is invisible to
 * every other check, and it breaks silently.
 */
const tailwindTheme = readFileSync(
  createRequire(import.meta.url).resolve('tailwindcss/theme.css'),
  'utf8',
)

function tailwindBreakpoint(name: string) {
  return tailwindTheme.match(
    new RegExp(`--breakpoint-${name}:\\s*([^;]+);`),
  )?.[1]
}

describe('breakpoints', () => {
  it('match the Tailwind breakpoints the layout uses', () => {
    expect(BREAKPOINTS.tablet).toBe(tailwindBreakpoint('md'))
    expect(BREAKPOINTS.desktop).toBe(tailwindBreakpoint('xl'))
  })

  it('are declared in the same unit as Tailwind, so a larger root font cannot split them', () => {
    for (const value of Object.values(BREAKPOINTS)) {
      expect(value).toMatch(/rem$/)
    }
  })
})
