import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }

  interface StaticDataRouteOption {
    /**
     * Render the header over the page's own first section instead of above it
     * on its own black band. The home page sets this so the hero photograph
     * runs the full height behind the navigation, as the design draws it.
     *
     * A page that opts in owns the backdrop, and it has to be dark enough for
     * white navigation — the hero's top strip averages #202020.
     */
    headerOverContent?: boolean
  }
}
