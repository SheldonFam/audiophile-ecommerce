import { Link } from '@tanstack/react-router'
import { SocialIcon } from './SocialIcon'
import type { SocialName } from './SocialIcon'
import { CATEGORIES } from '@/utils/products'

// Named for the platform rather than "Audiophile on Facebook": the hrefs are
// platform front pages, because the company is fictional and has no profiles.
// A name promising a profile would not predict where the link lands.
const SOCIALS: Array<{ name: string; href: string; icon: SocialName }> = [
  { name: 'Facebook', href: 'https://www.facebook.com', icon: 'facebook' },
  { name: 'Twitter', href: 'https://www.twitter.com', icon: 'twitter' },
  { name: 'Instagram', href: 'https://www.instagram.com', icon: 'instagram' },
]

const footerLink =
  'text-nav hover:text-orange focus-ring-on-dark transition-colors'

/**
 * The footer, on every page.
 *
 * Several pages here run to many screens on a phone, so repeating the
 * destinations at the bottom is genuine navigation rather than decoration.
 *
 * The arrangement changes at every breakpoint: centred and stacked on a phone,
 * left-aligned with a horizontal nav on a tablet, and on desktop the nav moves
 * up beside the logo while the social links move up beside the blurb.
 *
 * White at 50% on this background measures 5.37, so unlike the muted text on
 * light surfaces (ADR 0009) the design's own value already clears AA here.
 */
export function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-content mx-auto px-6 pb-9 md:px-10 xl:px-0">
        {/* The accent rule the design hangs above the footer. Decorative. */}
        <div className="bg-orange mx-auto h-1 w-25 md:mx-0" />

        <div className="mt-12 flex flex-col items-center gap-8 md:items-start xl:mt-14 xl:flex-row xl:justify-between">
          <Link to="/" className="focus-ring-on-dark">
            <img
              src="/assets/shared/desktop/logo.svg"
              alt="Audiophile — home"
              width={143}
              height={25}
            />
          </Link>

          <nav aria-label="Footer">
            <ul
              role="list"
              className="flex flex-col items-center gap-4 md:flex-row md:gap-8"
            >
              <li>
                <Link to="/" className={footerLink}>
                  Home
                </Link>
              </li>
              {CATEGORIES.map((category) => (
                <li key={category}>
                  <Link
                    to="/category/$category"
                    params={{ category }}
                    className={footerLink}
                  >
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-9 flex flex-col items-center gap-12 xl:flex-row xl:items-end xl:justify-between">
          <p className="text-body xl:max-w-copy text-center text-white/50 md:text-left">
            Audiophile is an all in one stop to fulfill your audio needs.
            We&rsquo;re a small team of music lovers and sound specialists who
            are devoted to helping you get the most out of personal audio. Come
            and visit our demo facility - we&rsquo;re open 7 days a week.
          </p>

          {/* Desktop lifts the social links up beside the blurb; below that they
              sit on the copyright row. Only one is ever in the accessibility
              tree, because `hidden` is display:none rather than visual hiding. */}
          <Socials className="hidden xl:flex" />
        </div>

        <div className="mt-12 flex flex-col items-center gap-12 md:flex-row md:justify-between xl:mt-14">
          <p className="text-body text-center font-bold text-white/50">
            Copyright 2021. All Rights Reserved
          </p>
          <Socials className="flex xl:hidden" />
        </div>
      </div>
    </footer>
  )
}

function Socials({ className }: { className: string }) {
  return (
    <ul role="list" className={`${className} shrink-0 items-center gap-4`}>
      {SOCIALS.map((social) => (
        <li key={social.name}>
          <a
            href={social.href}
            // Named here because the icon is decorative; without it the link
            // would have no accessible name at all.
            aria-label={social.name}
            className="focus-ring-on-dark hover:text-orange inline-block p-1.5 transition-colors"
          >
            <SocialIcon name={social.icon} />
          </a>
        </li>
      ))}
    </ul>
  )
}
