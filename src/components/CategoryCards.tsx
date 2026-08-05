import { Link } from '@tanstack/react-router'
import { Chevron } from './Chevron'
import { CATEGORIES } from '@/utils/products'
import type { Category } from '@/utils/products'

/**
 * The three category cards, which recur on nearly every page and are also what
 * the mobile menu renders.
 *
 * The thumbnails ship as a single file each rather than three crops, so unlike
 * most images on the site these are plain and not art-directed.
 *
 * The whole card is one link. The design draws "SHOP" as the affordance, but
 * making those four characters the target would give a small hit area and three
 * separate stops for a keyboard. So "SHOP" is decoration that responds to the
 * card's own hover and focus, and the card is the control.
 */
const THUMBNAILS: Record<Category, string> = {
  headphones: '/assets/shared/desktop/image-category-thumbnail-headphones.png',
  speakers: '/assets/shared/desktop/image-category-thumbnail-speakers.png',
  earphones: '/assets/shared/desktop/image-category-thumbnail-earphones.png',
}

export function CategoryCards() {
  return (
    // role="list" because Preflight removes the marker, and Safari then drops
    // the list role — so "list, 3 items" is never announced.
    <ul role="list" className="grid gap-x-3 gap-y-17 md:grid-cols-3 xl:gap-x-8">
      {CATEGORIES.map((category) => (
        <li key={category}>
          <Link
            to="/category/$category"
            params={{ category }}
            // Without this the name concatenates to "headphonesShop" — the two
            // spans are siblings, so nothing puts whitespace between them.
            // Worded in the visible reading order, which is what a speech-input
            // user will say.
            aria-label={`${category} shop`}
            className="group bg-grey flex h-full flex-col items-center rounded-lg px-6 pb-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
          >
            {/* A fixed square box pulled above the card, as the design overlaps
                it on the edge. The three thumbnails differ in height
                (422/408/380), so object-bottom sits them all on the same
                baseline and lets their tops stagger, which is how the design
                draws them. */}
            <img
              src={THUMBNAILS[category]}
              alt=""
              className="-mt-13 h-32 w-32 object-contain object-bottom md:h-38 md:w-38 xl:-mt-20 xl:h-50 xl:w-50"
            />
            <span className="text-h6 mt-auto pt-4">{category}</span>
            <span className="text-button group-hover:text-orange group-focus-visible:text-orange mt-4 flex items-center gap-3 text-black/60 uppercase transition-colors">
              Shop
              <Chevron />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
