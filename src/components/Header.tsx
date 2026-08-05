import { Link, useRouterState } from '@tanstack/react-router'
import { MobileMenu } from './MobileMenu'
import { CATEGORIES } from '@/utils/products'

/**
 * The header, on every page.
 *
 * Desktop shows the four destinations inline. Phone and tablet collapse them
 * behind a menu control, so the header does not consume the screen the visitor
 * came to read. Only one set is ever exposed — `hidden` removes the inline nav
 * from the accessibility tree rather than merely hiding it — so assistive
 * technology never meets the same links twice.
 *
 * The cart control renders but does nothing: no cart exists until the next
 * feature. It stays enabled and focusable, because `disabled` removes a control
 * from the tab order and this ticket asks every control here to be keyboard
 * reachable. It is named "Cart" rather than "Cart, empty" — there is no cart to
 * describe the state of yet.
 */
const navLink =
  'text-nav hover:text-orange focus-ring-on-dark transition-colors'

export function Header() {
  // Read from the matched route rather than from its path: the shell should not
  // have to know which addresses happen to want this.
  const overContent = useRouterState({
    select: (state) =>
      state.matches.some((match) => match.staticData.headerOverContent),
  })

  return (
    <header
      className={`text-white ${
        overContent ? 'absolute inset-x-0 top-0 z-20' : 'bg-black'
      }`}
    >
      {/* The height is stated rather than left to the tallest child. Below md
          the logo is taken out of flow to centre it, so it contributed nothing
          and the menu button ended up deciding how tall the header was — 85
          against the design's 90, with every page sitting that much high.
          `min-h` rather than `h` so enlarged text still has somewhere to go.

          relative so the centred logo positions against this row rather than
          the initial containing block. */}
      <div className="max-w-content relative mx-auto flex min-h-22.5 items-center gap-6 border-b border-white/20 px-6 md:px-10 xl:min-h-24.25 xl:px-0">
        <MobileMenu />

        <Link
          to="/"
          className="focus-ring-on-dark absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0"
        >
          <img
            src="/assets/shared/desktop/logo.svg"
            alt="Audiophile — home"
            width={143}
            height={25}
          />
        </Link>

        <nav aria-label="Primary" className="hidden flex-1 xl:block">
          <ul role="list" className="flex justify-center gap-8">
            <li>
              <Link to="/" className={navLink}>
                Home
              </Link>
            </li>
            {CATEGORIES.map((category) => (
              <li key={category}>
                <Link
                  to="/category/$category"
                  params={{ category }}
                  className={navLink}
                >
                  {category}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          aria-label="Cart"
          className="focus-ring-on-dark -m-1.5 ml-auto shrink-0 p-1.5 xl:ml-0"
        >
          <img
            src="/assets/shared/desktop/icon-cart.svg"
            alt=""
            width={23}
            height={20}
          />
        </button>
      </div>
    </header>
  )
}
