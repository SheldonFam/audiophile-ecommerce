import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { render, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

/**
 * Renders a component that contains links.
 *
 * TanStack's `Link` resolves against the routes the router knows, so a
 * component holding one cannot be rendered bare — and a router with only a root
 * route renders nothing, because `to="/category/$category"` matches no route.
 *
 * So the harness declares the same paths the application does, with empty
 * components. Links resolve and navigation works, while the test stays about
 * the component rather than about any real page.
 */
export async function renderWithRouter(ui: ReactNode) {
  const rootRoute = createRootRoute({
    component: () => (
      <>
        {ui}
        <Outlet />
      </>
    ),
  })

  const routeTree = rootRoute.addChildren([
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      component: Empty,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/category/$category',
      component: Empty,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/product/$slug',
      component: Empty,
    }),
  ])

  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  // No cast: RouterProvider is generic over the router it is given, and the
  // Register augmentation only supplies the default. `as never` would type-check
  // by disabling the check, hiding any real mismatch between this throwaway
  // tree and the routes under test.
  const result = render(<RouterProvider router={router} />)

  // RouterProvider renders on a later tick, so a synchronous query straight
  // after render() sees an empty document. Await the first paint here rather
  // than making every test remember to.
  await waitFor(() => {
    if (!result.container.firstChild) throw new Error('router has not rendered')
  })

  return result
}

function Empty() {
  return null
}
