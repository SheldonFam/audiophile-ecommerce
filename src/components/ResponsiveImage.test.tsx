import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BREAKPOINTS, ResponsiveImage } from './ResponsiveImage'

const BEST_GEAR = {
  mobile: '/assets/shared/mobile/image-best-gear.jpg',
  tablet: '/assets/shared/tablet/image-best-gear.jpg',
  desktop: '/assets/shared/desktop/image-best-gear.jpg',
}

/**
 * The spec lists this component under "not tested", and for its markup that is
 * right — jsdom never evaluates `<picture>` or `media`, so a rendering test
 * could only assert the component's own literals back out.
 *
 * What is worth testing is what the component exists to guarantee: that images
 * change crop at exactly the widths the layout changes at, and that each crop
 * reserves its own space. Both are relationships with something outside this
 * file — Tailwind's theme, and the image files — and both break silently.
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

describe('reserving space', () => {
  it('gives each source the dimensions of its own crop, not one pair for all three', async () => {
    const { container } = render(<ResponsiveImage image={BEST_GEAR} alt="" />)

    const [desktop, tablet] = [...container.querySelectorAll('source')]
    const img = container.querySelector('img')!

    // best-gear is a wide banner on a tablet and portrait on a desktop, so a
    // single pair would reserve the wrong box at two breakpoints out of three.
    expect([
      desktop.getAttribute('width'),
      desktop.getAttribute('height'),
    ]).toEqual(['540', '588'])
    expect([
      tablet.getAttribute('width'),
      tablet.getAttribute('height'),
    ]).toEqual(['1378', '600'])
    expect([img.getAttribute('width'), img.getAttribute('height')]).toEqual([
      '654',
      '600',
    ])
  })

  it('leaves an unmeasured image alone rather than guessing a ratio for it', () => {
    const svg = {
      mobile: '/assets/a.svg',
      tablet: '/assets/b.svg',
      desktop: '/assets/c.svg',
    }
    const { container } = render(<ResponsiveImage image={svg} alt="" />)

    expect(container.querySelector('img')!.hasAttribute('width')).toBe(false)
  })
})
