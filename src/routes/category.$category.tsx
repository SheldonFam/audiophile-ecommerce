import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { getProductsByCategory, isCategory } from '@/utils/products'

export const Route = createFileRoute('/category/$category')({
  loader: ({ params }) => {
    if (!isCategory(params.category)) throw notFound()
    return {
      category: params.category,
      products: getProductsByCategory(params.category),
    }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${titleCase(loaderData?.category)} — Audiophile` }],
  }),
  component: CategoryPage,
})

function titleCase(value: string | undefined) {
  if (!value) return 'Category'
  return value[0].toUpperCase() + value.slice(1)
}

/**
 * Placeholder until ticket 10. The product links let the prerender crawler
 * reach every product address from the home page.
 */
function CategoryPage() {
  const { category, products } = Route.useLoaderData()

  return (
    <main className="max-w-content mx-auto px-6 py-16">
      <h1 className="text-h3 mb-8">{category}</h1>
      <ul className="flex flex-col gap-4">
        {products.map((product) => (
          <li key={product.slug}>
            <Link
              to="/product/$slug"
              params={{ slug: product.slug }}
              className="text-h6 text-orange hover:underline"
            >
              {product.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
