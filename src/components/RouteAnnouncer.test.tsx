import {
  HeadContent,
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RouteAnnouncer } from './RouteAnnouncer'

/**
 * A real router, because the whole behaviour is a reaction to navigation —
 * mocking that away would leave nothing worth asserting.
 *
 * The routes declare their titles through `head`, the way the application's do,
 * rather than the test setting `document.title` by hand. That distinction
 * caught a real bug: the first version of this component read the DOM, and a
 * test that wrote the title before navigating passed while the browser
 * announced the page it had just left.
 */
async function renderApp() {
  const rootRoute = createRootRoute({
    component: () => (
      <>
        {/* The real thing that writes the title, so the announcement is
            compared against what the framework actually produced rather than
            against the same `head` declarations this component reads. That is
            what keeps the two title resolvers in step. */}
        <HeadContent />
        <RouteAnnouncer>
          <Outlet />
        </RouteAnnouncer>
      </>
    ),
  })

  const routeTree = rootRoute.addChildren([
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      head: () => ({ meta: [{ title: 'Audiophile' }] }),
      component: () => <main>home</main>,
    }),
    // Two addresses that resolve to the same name, which is what the design
    // system page and any not-found page do in the application.
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/same-name/$id',
      head: () => ({ meta: [{ title: 'Audiophile' }] }),
      component: () => <main>same</main>,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/product/$slug',
      head: ({ params }) => ({
        meta: [{ title: `${params.slug} — Audiophile` }],
      }),
      component: () => <main>product</main>,
    }),
  ])

  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  const result = render(<RouterProvider router={router as never} />)
  await waitFor(() => {
    if (!result.container.firstChild) throw new Error('router has not rendered')
  })

  const liveRegion = () => screen.getByRole('status')
  const goToProduct = async (slug: string) => {
    await router.navigate({ to: '/product/$slug', params: { slug } } as never)
    await waitFor(() =>
      expect(liveRegion()).toHaveTextContent(`${slug} — Audiophile`),
    )
  }

  return { ...result, router, liveRegion, goToProduct }
}

describe('RouteAnnouncer', () => {
  it('says nothing on the first page, which the browser has already announced', async () => {
    const { liveRegion } = await renderApp()

    expect(liveRegion()).toBeEmptyDOMElement()
  })

  it('leaves focus alone on the first page', async () => {
    await renderApp()

    expect(document.activeElement).toBe(document.body)
  })

  it('announces the new page by name once navigation happens', async () => {
    const { liveRegion, goToProduct } = await renderApp()

    await goToProduct('zx9-speaker')

    expect(liveRegion()).toHaveTextContent('zx9-speaker — Audiophile')
  })

  it('announces exactly what the framework put in the title', async () => {
    const { liveRegion, goToProduct } = await renderApp()

    await goToProduct('zx9-speaker')

    // Not the same source: the title comes from `HeadContent`, the
    // announcement from this component's own reading of the matches. If the
    // two ever resolve a page's name differently — a different match wins, or
    // a different tag within one — the ear and the tab disagree and this is
    // what says so.
    await waitFor(() => {
      expect(document.title).not.toBe('')
      expect(liveRegion()).toHaveTextContent(document.title)
    })
  })

  it('announces a move between two products, which is one route with a different parameter', async () => {
    const { liveRegion, goToProduct } = await renderApp()

    await goToProduct('zx9-speaker')
    await goToProduct('zx7-speaker')

    // The case the ticket was raised for: the route never changes, so anything
    // watching the matched route rather than the address would stay silent.
    // Announcing the page just left would also show up here.
    expect(liveRegion()).toHaveTextContent('zx7-speaker — Audiophile')
    expect(liveRegion()).not.toHaveTextContent('zx9-speaker')
  })

  it("moves focus to the new page's landmark instead of leaving it on what was clicked", async () => {
    const { container, goToProduct } = await renderApp()
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    await goToProduct('zx9-speaker')

    // The landmark, not the wrapper: it announces itself and says where the
    // reader now is, where an unnamed div announces nothing.
    await waitFor(() =>
      expect(document.activeElement).toBe(container.querySelector('main')),
    )
    expect(document.activeElement).not.toBe(trigger)
    trigger.remove()
  })

  it('announces again when two pages happen to share a title', async () => {
    // The failure this guards is silent by construction: setting state to the
    // string it already holds re-renders nothing, so the text node never
    // mutates and no screen reader fires. Focus still moves, so the visitor is
    // put on a page they were never told about.
    const { liveRegion, router } = await renderApp()
    const announcements: Array<string> = []
    const observer = new MutationObserver(() =>
      announcements.push(liveRegion().textContent),
    )
    observer.observe(liveRegion(), {
      childList: true,
      characterData: true,
      subtree: true,
    })

    await router.navigate({
      to: '/same-name/$id',
      params: { id: 'a' },
    } as never)
    await waitFor(() => expect(liveRegion()).toHaveTextContent('Audiophile'))
    await router.navigate({
      to: '/same-name/$id',
      params: { id: 'b' },
    } as never)
    await waitFor(() => expect(router.state.location.href).toContain('/b'))
    await new Promise((resolve) => setTimeout(resolve, 50))
    observer.disconnect()

    // Two arrivals, so the region has to have changed twice — the text alone
    // is identical both times and proves nothing.
    expect(announcements.length).toBeGreaterThanOrEqual(2)
  })

  it('keeps the live region in the tree from the start, so its first message is not missed', async () => {
    const { liveRegion } = await renderApp()

    expect(liveRegion()).toHaveAttribute('aria-live', 'polite')
    expect(liveRegion()).toBeInTheDocument()
  })
})
