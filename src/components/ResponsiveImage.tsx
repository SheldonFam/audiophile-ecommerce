import type { ComponentProps } from 'react'
import type { ImageSource } from '@/utils/products'

/**
 * Delivers the crop the designer intended for the visitor's screen.
 *
 * The challenge ships every image pre-exported three times, and those are
 * different *crops*, not one picture at three sizes — `image-best-gear` is
 * near-square on a phone (1.09), a wide banner on a tablet (2.30) and portrait
 * on a desktop (0.92). Its desktop file is even smaller than its tablet one,
 * because desktop places it in a column rather than full width.
 *
 * That is art direction, so selection must be driven by viewport width through
 * `media`. `srcset` alone describes the same picture at different resolutions
 * and would let the browser hand a desktop crop to a phone.
 *
 * ## Call-site conventions
 *
 * Loading is eager by default, which is right for the hero and wrong for the
 * forty images below the fold. Above the fold, pass `fetchPriority="high"`;
 * below it, pass `loading="lazy"`. There is deliberately no `priority` prop —
 * the underlying attributes already say it, and one more boolean would not.
 *
 * `alt` must hold for all three crops. Describe the subject, not the
 * composition, since a crop that reframes can drop whatever the wording named.
 */

/**
 * Stated in `rem` to match Tailwind's `md` and `xl`, which the layout uses
 * (ADR 0004). Tailwind's are `48rem` and `80rem`; writing `768px` here would
 * agree only at a 16px root, so a visitor who raises their default font size
 * would get the layout switching at one width and the crop at another.
 * `breakpoints.test.ts` fails if these drift from Tailwind's.
 */
export const BREAKPOINTS = {
  tablet: '48rem',
  desktop: '80rem',
} as const

type ResponsiveImageProps = {
  image: ImageSource
  /** Required. Decorative images must pass an explicit empty string. */
  alt: string
} & Omit<
  ComponentProps<'img'>,
  // src/srcSet/alt are owned by this component. width/height/sizes are refused
  // because they cannot be right for three crops of different aspect ratios,
  // and `sizes` is inert without `srcset` while implying it works.
  //
  // aria-hidden is refused because it would silently remove a meaningful image
  // from the accessibility tree, defeating the required-alt contract with no
  // type or lint error. Decorative images say so with alt="".
  'src' | 'srcSet' | 'alt' | 'width' | 'height' | 'sizes' | 'aria-hidden'
>

export function ResponsiveImage({
  image,
  alt,
  ...props
}: ResponsiveImageProps) {
  return (
    // `contents` removes the picture box, so a caller's layout classes on the
    // img participate in the parent's layout directly rather than being
    // trapped in an inline wrapper with a baseline descender gap.
    //
    // It also promotes the `source` children to layout items, and `source`
    // computes to `display: block`, not `none` — inside a grid each one would
    // silently claim a cell. `styles.css` hides them; do not remove that rule.
    //
    // Keyed on the source so a route that reuses this instance — product to
    // related product — remounts rather than mutating srcset in place, which
    // Safari has historically not re-evaluated.
    <picture className="contents" key={image.mobile}>
      {/* Ordered widest first: the browser takes the first matching source. */}
      <source
        media={`(min-width: ${BREAKPOINTS.desktop})`}
        srcSet={image.desktop}
      />
      <source
        media={`(min-width: ${BREAKPOINTS.tablet})`}
        srcSet={image.tablet}
      />
      {/* Spread first so alt and src cannot be overridden — otherwise a caller
          passing aria-hidden could silently defeat the required-alt contract. */}
      <img {...props} src={image.mobile} alt={alt} />
    </picture>
  )
}
