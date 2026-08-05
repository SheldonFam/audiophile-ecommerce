import { describe, expect, it } from 'vitest'
import { dimensionsOf } from './imageDimensions'

/**
 * That the manifest still matches the files on disk is checked by
 * `pnpm images --check` in CI, not here — it is a fact about the repository
 * rather than about anything this module does.
 *
 * What is left for a unit test is the lookup's own contract.
 */
describe('the image manifest', () => {
  it('reads both formats the challenge ships', () => {
    // A JPEG's size sits behind a variable-length segment chain and a PNG's at
    // a fixed offset, so the two parsers share nothing and are worth naming.
    expect(dimensionsOf('/assets/home/desktop/image-hero.jpg')).toEqual({
      width: 1440,
      height: 729,
    })
    expect(dimensionsOf('/assets/home/mobile/image-speaker-zx9.png')).toEqual({
      width: 320,
      height: 388,
    })
  })
})

describe('dimensionsOf', () => {
  it('gives each crop of one image its own pair, not one shared ratio', () => {
    // The case that rules out putting width and height on the img alone:
    // best-gear is a wide banner on a tablet and portrait on a desktop.
    const tablet = dimensionsOf('/assets/shared/tablet/image-best-gear.jpg')!
    const desktop = dimensionsOf('/assets/shared/desktop/image-best-gear.jpg')!

    expect(tablet.width / tablet.height).toBeGreaterThan(2)
    expect(desktop.width / desktop.height).toBeLessThan(1)
  })

  it('returns nothing for a path it has not measured, rather than a guess', () => {
    expect(dimensionsOf('/assets/shared/desktop/logo.svg')).toBeUndefined()
    expect(dimensionsOf('/assets/not-a-real-image.jpg')).toBeUndefined()
  })
})
