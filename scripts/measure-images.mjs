// Reads the intrinsic size of every raster asset and writes it to a manifest
// the app imports, so `ResponsiveImage` can reserve each crop's space before
// its bytes arrive.
//
// Run with `pnpm images` to write it, or `pnpm images --check` to fail when it
// has drifted from what is on disk. CI runs the check, so a stale manifest —
// which still renders, just reserving the wrong box — cannot ship. The check
// lives here rather than in a unit test because it is about the repository's
// files, not about anything the application does at runtime.
//
// The two formats are parsed from their headers rather than through a library:
// it is a few lines each, it reads only the first bytes of a file, and it adds
// nothing to the dependency tree for a job the build does once.

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join, relative, sep } from 'node:path'

// Resolved from the working directory rather than from `import.meta.url`, so
// the same module works when run as a script and when the test imports it
// through a bundler that does not hand it a file URL.
const ROOT = process.cwd()
const ASSETS = join(ROOT, 'public', 'assets')
const MANIFEST = join(ROOT, 'src', 'data', 'image-dimensions.json')

/** PNG puts width and height in the IHDR chunk, at a fixed offset. */
function pngSize(bytes) {
  if (bytes.readUInt32BE(0) !== 0x89504e47) return undefined
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

/**
 * JPEG has no fixed offset: the size lives in a start-of-frame segment that
 * sits after a variable number of other segments, so the segment chain has to
 * be walked. SOF0 through SOF15 all carry it, except the four markers in that
 * range that mean something else (DHT, JPG, DAC, DNL).
 */
function jpegSize(bytes) {
  if (bytes.readUInt16BE(0) !== 0xffd8) return undefined

  let offset = 2
  while (offset < bytes.length - 9) {
    if (bytes[offset] !== 0xff) {
      offset += 1
      continue
    }

    const marker = bytes[offset + 1]
    const isStartOfFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc

    if (isStartOfFrame) {
      // length(2) precision(1) then height(2) width(2)
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
      }
    }

    // Standalone markers carry no length segment; everything else does.
    // Those are TEM and the restart markers, which SOI and EOI sit among.
    const isStandalone = marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)
    offset += isStandalone ? 2 : 2 + bytes.readUInt16BE(offset + 2)
  }

  return undefined
}

export function readImageSize(bytes) {
  return pngSize(bytes) ?? jpegSize(bytes)
}

/** Web paths, because that is what a call site holds. */
export async function measureAssets() {
  const files = await readdir(ASSETS, { recursive: true, withFileTypes: true })
  const sizes = {}

  for (const file of files) {
    if (!file.isFile() || !/\.(png|jpe?g)$/i.test(file.name)) continue

    const absolute = join(file.parentPath ?? file.path, file.name)
    const size = readImageSize(await readFile(absolute))
    if (!size) throw new Error(`could not read the size of ${absolute}`)

    const webPath = `/assets/${relative(ASSETS, absolute).split(sep).join('/')}`
    sizes[webPath] = size
  }

  // Sorted so regenerating never produces a diff that is only reordering.
  return Object.fromEntries(Object.entries(sizes).sort(([a], [b]) => (a < b ? -1 : 1)))
}

if (basename(process.argv[1] ?? '') === 'measure-images.mjs') {
  const sizes = await measureAssets()
  const serialised = `${JSON.stringify(sizes, null, 2)}\n`
  const count = Object.keys(sizes).length

  if (process.argv.includes('--check')) {
    const committed = await readFile(MANIFEST, 'utf8')
    if (committed !== serialised) {
      console.error(
        `${relative(ROOT, MANIFEST)} does not match the ${count} images on disk. Run \`pnpm images\`.`,
      )
      process.exit(1)
    }
    console.log(`${relative(ROOT, MANIFEST)} matches all ${count} images on disk`)
  } else {
    await writeFile(MANIFEST, serialised)
    console.log(`measured ${count} images into ${relative(ROOT, MANIFEST)}`)
  }
}
