import dimensions from '@/data/image-dimensions.json'

/**
 * The intrinsic size of every raster asset, measured from the files themselves
 * by `pnpm images` and committed as `src/data/image-dimensions.json`.
 *
 * Reserving an image's space needs its real proportions, and those are a
 * property of the file. Asking a call site for them would mean forty places
 * repeating numbers they cannot check; asking the designer for them would mean
 * a second copy that can drift. Measuring the file has neither problem, and
 * `pnpm images --check` fails the build if the manifest and the files disagree.
 */
export type Dimensions = { width: number; height: number }

const sizes: Record<string, Dimensions | undefined> = dimensions

/**
 * Returns nothing rather than a guess for a path that was not measured — an
 * SVG, say, or a file added without regenerating. An image with no dimensions
 * behaves exactly as it did before this existed: it loads, and it does not
 * reserve. Inventing a ratio would reserve the wrong space, which is worse
 * than reserving none.
 */
export function dimensionsOf(path: string): Dimensions | undefined {
  return sizes[path]
}
