import { createFileRoute, notFound } from '@tanstack/react-router'
import { BestGear } from '@/components/BestGear'
import { ButtonLink } from '@/components/Button'
import { CategoryCards } from '@/components/CategoryCards'
import { ResponsiveImage } from '@/components/ResponsiveImage'
import { splitBeforeLastWord } from '@/utils/productName'
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
 * One page per category, listing its products newest first.
 *
 * Each entry gives an image, the name, the full description and one control
 * through to the detail page. `getProductsByCategory` owns the order.
 *
 * On desktop the image alternates side down the list. `flex-row-reverse` flips
 * how a row is painted without touching the markup, so the DOM order is
 * image-then-copy on every row either way and 1.3.2 is never in question — the
 * alternative, reordering the markup per row, is what would put it in question.
 */
function CategoryPage() {
  const { category, products } = Route.useLoaderData()

  return (
    <main>
      {/* Full bleed, and continuous with the header's own black — in the design
          the two read as one band, divided by the header's rule. */}
      <div className="flex min-h-25.5 items-center justify-center bg-black px-6 py-8 text-white md:min-h-61.5">
        <h1 className="text-h4 md:text-h2 text-center">{category}</h1>
      </div>

      <div className="max-w-content mx-auto px-6 pb-30 md:px-10 xl:px-0 xl:pb-40">
        <ul
          role="list"
          className="mt-16 flex flex-col gap-30 md:mt-30 xl:mt-40 xl:gap-40"
        >
          {products.map((product, index) => {
            const { lead, lastWord } = splitBeforeLastWord(product.name)
            return (
              <li
                key={product.slug}
                className={`flex flex-col items-center gap-8 text-center md:gap-13 xl:flex-row xl:gap-31.25 xl:text-left ${
                  index % 2 === 1 ? 'xl:flex-row-reverse' : ''
                }`}
              >
                <ResponsiveImage
                  image={product.categoryImage}
                  alt=""
                  loading={index === 0 ? undefined : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : undefined}
                  className="w-full rounded-lg xl:w-135 xl:shrink-0"
                />

                {/* Capped on tablet so the description does not run the full 689
                  and become hard to track from line to line. */}
                <div className="md:max-w-143 xl:w-111.25 xl:shrink-0">
                  {product.new && (
                    <p className="text-overline text-orange-text mb-6 md:mb-4">
                      New Product
                    </p>
                  )}

                  <h2
                    id={`name-${product.slug}`}
                    className="text-h4 md:text-h2"
                  >
                    {lead}
                    <span className="block">{lastWord}</span>
                  </h2>

                  <p className="text-body mt-6 text-black/60 md:mt-8">
                    {product.description}
                  </p>

                  {/* Every link on the page reads "See Product", so each composes
                    its name from its own text plus the product heading. */}
                  <ButtonLink
                    to="/product/$slug"
                    params={{ slug: product.slug }}
                    id={`see-${product.slug}`}
                    aria-labelledby={`see-${product.slug} name-${product.slug}`}
                    className="mt-6 xl:mt-10"
                  >
                    See Product
                  </ButtonLink>
                </div>
              </li>
            )
          })}
        </ul>

        {/* The thumbnails overhang each card's top by 52px on phone and tablet
            and 80px on desktop, so these margins are the design's 120 and 160
            gaps plus that overhang. */}
        <div className="mt-43 xl:mt-60">
          <CategoryCards />
        </div>

        <div className="mt-30 xl:mt-40">
          <BestGear />
        </div>
      </div>
    </main>
  )
}
