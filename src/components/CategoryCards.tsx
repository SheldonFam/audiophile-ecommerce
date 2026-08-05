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

export function CategoryCards({ onChoose }: { onChoose?: () => void }) {
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
            // Lets a container react to a choice — the menu closes itself this
            // way rather than watching the route or sniffing the DOM. Enter on
            // a link fires click, so it covers the keyboard too.
            onClick={onChoose}
            className="group bg-grey flex h-full flex-col items-center rounded-lg px-6 pb-5.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black xl:pb-7.5"
          >
            {/* A box carrying the tallest file's aspect ratio — 438:422 — so
                that file fills it exactly and the other two, being shorter,
                letterbox. It is pulled above the card, as the design overlaps
                it on the edge, and object-bottom sits all three on one baseline
                and lets their tops stagger, which is how the design draws them.

                The box is sized so the tallest lands on the design's height —
                104 on a phone and tablet, 160 on a desktop. It used to be 200
                on a desktop, which put 120 of the image inside the card where
                the design puts 80, and made the card 16px too tall on every
                page that shows it. */}
            <img
              src={THUMBNAILS[category]}
              alt=""
              loading="lazy"
              className="-mt-13 h-26 w-27 object-contain object-bottom xl:-mt-20 xl:h-40 xl:w-41.5"
            />
            <span className="text-h6-mobile xl:text-h6 mt-auto pt-9">
              {category}
            </span>
            <span className="text-button group-hover:text-orange-text group-focus-visible:text-orange-text mt-4.25 flex items-center gap-3 text-black/60 uppercase transition-colors xl:mt-4">
              Shop
              <Chevron />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
