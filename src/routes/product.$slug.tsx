import { createFileRoute, notFound } from '@tanstack/react-router'
import { getProduct } from '@/utils/products'

export const Route = createFileRoute('/product/$slug')({
  loader: ({ params }) => {
    const product = getProduct(params.slug)
    if (!product) throw notFound()
    return product
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.name ?? 'Product'} — Audiophile` }],
  }),
  component: ProductPage,
})

/** Placeholder until tickets 07–09. */
function ProductPage() {
  const product = Route.useLoaderData()

  return (
    <main className="max-w-content mx-auto px-6 py-16">
      <h1 className="text-h3">{product.name}</h1>
    </main>
  )
}
