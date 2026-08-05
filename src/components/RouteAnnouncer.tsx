import { useRouterState } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import type { AnyRouteMatch } from '@tanstack/react-router'
import type { ReactNode } from 'react'

/**
 * Says that the page changed, and puts the keyboard at the top of it.
 *
 * A full page load announces itself and resets focus. A client-side navigation
 * does neither: the URL and the DOM change while the screen reader says nothing
 * and focus stays on whatever was activated — which, following a related-product
 * card, is a control that now means a different product.
 *
 * Both halves are needed and neither is enough. A live region alone tells
 * someone the page changed but leaves them where they were, several sections
 * down. Moving focus alone is silent.
 *
 * This wraps the routes rather than being dropped into them, so every page gets
 * it and no page has to remember to.
 */

/**
 * The page's name, resolved the way the framework resolves the one it writes
 * into the document: the innermost route that names the page wins, and within
 * a route's own tags the last title wins.
 *
 * Both directions matter, and getting either backwards would put a different
 * name in the ear than in the tab. `meta` is typed by the router, so this
 * reads it rather than re-deriving its shape.
 */
function titleOf(matches: ReadonlyArray<AnyRouteMatch>) {
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const meta = matches[index].meta
    if (!meta) continue

    for (let tag = meta.length - 1; tag >= 0; tag -= 1) {
      const title = meta[tag]?.title
      if (title) return title
    }
  }

  return ''
}

export function RouteAnnouncer({ children }: { children: ReactNode }) {
  // One subscription, so the address and the name of the page it leads to are
  // always read from the same snapshot. Two would let the address arrive first
  // and the title a commit later, which announces the page just left and then
  // corrects itself — and the reader hears both. `pending` is skipped for the
  // same reason: mid-navigation the address has changed and the new match's
  // title has not resolved.
  const page = useRouterState({
    select: (state) => ({
      href: state.location.href,
      title: titleOf(state.matches),
      settled: state.status !== 'pending',
    }),
  })

  const { href, title, settled } = page

  const start = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)
  const announcedFor = useRef<string | null>(null)

  // Two pages can share a title — the design-system page and any not-found
  // page are both called "Audiophile". Re-rendering with the same string is
  // not enough to announce it: React leaves a text node whose text has not
  // changed alone, so there is nothing for a live region to notice and the
  // visitor lands silently on a page they did not ask for. Emptying it first
  // and filling it a frame later gives the region a change to report.
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    // The browser has already announced the first page and put focus at its
    // top. Doing it again would be an echo.
    if (isFirstRender.current) {
      isFirstRender.current = false
      announcedFor.current = href
      return
    }

    if (!settled || announcedFor.current === href) return
    announcedFor.current = href

    setAnnouncement('')

    const frame = requestAnimationFrame(() => {
      // Filled a frame after being emptied, so the text always changes even
      // when the name has not. Also keeps the message clear of the focus move
      // below: a polite announcement arriving in the same beat as a focus
      // change is one screen readers are known to drop.
      setAnnouncement(title)

      // The route's own landmark, which announces itself as one and says where
      // the reader now is. An unnamed wrapper announces nothing in VoiceOver,
      // and drops NVDA's cursor onto whatever the first line happens to be —
      // on a product page, the "Go Back" control. Scoped to this subtree, so
      // it can only find the page currently rendered.
      const target = start.current?.querySelector('main') ?? start.current
      if (!target) return

      target.tabIndex = -1
      target.focus()
    })

    return () => cancelAnimationFrame(frame)
    // The three values, not the object holding them: `select` builds a fresh
    // object on every render, so depending on it would re-run this effect
    // continuously and cancel its own frame before it could fire.
  }, [href, title, settled])

  return (
    <>
      {/* The ring is hidden because it would outline a whole page or landmark
          and say nothing about where focus is. ADR 0010 governs rings on
          things a keyboard can reach; nothing here is in the tab order. */}
      <div
        ref={start}
        tabIndex={-1}
        className="outline-none [&_main]:outline-none"
      >
        {children}
      </div>

      {/* Rendered from the start and left empty, because a live region has to
          be in the accessibility tree before its text changes — one inserted
          together with its message is routinely missed. `role="status"` beside
          `aria-live` because JAWS is more reliable given both.

          The whole document title is announced, site name and all, so that
          what is heard, what is in the tab and what is in the history entry
          are the same string. */}
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </p>
    </>
  )
}
