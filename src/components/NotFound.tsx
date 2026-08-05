import { Link } from '@tanstack/react-router'

/** Shown for an unknown address, and for a category or product that does not exist. */
export function NotFound() {
  return (
    <main className="max-w-content mx-auto px-6 py-16">
      <h1 className="text-h3 mb-4">Page not found</h1>
      <p className="text-body mb-8">
        We couldn&rsquo;t find what you were looking for.
      </p>
      <Link to="/" className="text-h6 text-orange hover:underline">
        Back to home
      </Link>
    </main>
  )
}
