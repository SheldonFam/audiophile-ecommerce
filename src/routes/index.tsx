import { Link, createFileRoute } from '@tanstack/react-router'
import { CATEGORIES } from '@/utils/products'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [{ title: 'Audiophile — High-end audio gear' }],
  }),
  component: Home,
})

/**
 * Placeholder until ticket 11. The category links are load-bearing: the
 * prerender crawler starts here and follows them to discover every address.
 */
function Home() {
  return (
    <main className="max-w-content mx-auto px-6 py-16">
      <h1 className="text-h3 mb-8">Audiophile</h1>
      <ul className="flex flex-col gap-4">
        {CATEGORIES.map((category) => (
          <li key={category}>
            <Link
              to="/category/$category"
              params={{ category }}
              className="text-h6 text-orange hover:underline"
            >
              {category}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
