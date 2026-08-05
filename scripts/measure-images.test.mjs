import { describe, expect, it } from 'vitest'
import { readImageSize } from './measure-images.mjs'

/**
 * Lives beside the script rather than under `src/`, because that is what it is
 * about: nothing in the application imports either file.
 *
 * The parsers read raw bytes at fixed offsets, which is the kind of code that
 * fails in two ugly ways — throwing on a file too short to hold the offsets it
 * reads, or returning whatever the bytes happen to spell when a file only
 * looks like the format. Either one ends up in the manifest, and from there in
 * a `width` attribute on the page. Both must come back as nothing instead, so
 * the caller can name the file it could not read.
 */
describe('readImageSize', () => {
  const png = (...tail) =>
    Buffer.concat([
      Buffer.from('89504e470d0a1a0a', 'hex'),
      ...tail.map((part) => (Buffer.isBuffer(part) ? part : Buffer.from(part))),
    ])

  it.each([
    ['an empty file', Buffer.alloc(0)],
    ['a file too short to hold a header', Buffer.from([0xff, 0xd8])],
    ['a PNG signature and nothing else', png()],
    ['a PNG truncated inside its first chunk', png(Buffer.alloc(10))],
    [
      'a PNG whose first chunk is not IHDR',
      png(Buffer.alloc(4), 'tEXt', Buffer.alloc(8, 0x41)),
    ],
    [
      'a JPEG with no frame header before its scan',
      Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff, 0xda]),
        Buffer.alloc(64, 0xff),
      ]),
    ],
    ['something that is not an image', Buffer.from('not an image at all')],
  ])('reports nothing for %s', (_name, bytes) => {
    expect(readImageSize(bytes)).toBeUndefined()
  })

  it('reports nothing for a header that parses but declares an absurd size', () => {
    // Well-formed as far as the signature and chunk name go, so neither of the
    // structural checks catches it. Only the range does.
    const header = Buffer.alloc(24)
    Buffer.from('89504e470d0a1a0a', 'hex').copy(header, 0)
    header.write('IHDR', 12, 'latin1')
    header.writeUInt32BE(4_000_000_000, 16)
    header.writeUInt32BE(4_000_000_000, 20)

    expect(readImageSize(header)).toBeUndefined()
  })

  it('reads a well-formed PNG header', () => {
    const header = Buffer.alloc(24)
    Buffer.from('89504e470d0a1a0a', 'hex').copy(header, 0)
    header.write('IHDR', 12, 'latin1')
    header.writeUInt32BE(320, 16)
    header.writeUInt32BE(388, 20)

    expect(readImageSize(header)).toEqual({ width: 320, height: 388 })
  })
})
