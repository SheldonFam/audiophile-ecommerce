import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ButtonLink } from './Button'
import { renderWithRouter } from '@/test/renderWithRouter'

/**
 * `ButtonLink` is the styling of a button on something that navigates.
 *
 * Its whole reason to exist is that navigation must stay a link — middle-click
 * and "open in new tab" have to keep working — so the tests are about the
 * anchor and its href, not about classes.
 */
describe('ButtonLink', () => {
  it('renders an anchor carrying the resolved href for a route parameter', async () => {
    await renderWithRouter(
      <ButtonLink to="/product/$slug" params={{ slug: 'zx9-speaker' }}>
        See Product
      </ButtonLink>,
    )

    const link = screen.getByRole('link', { name: 'See Product' })
    expect(link).toHaveAttribute('href', '/product/zx9-speaker')
  })

  it('lets a caller compose an accessible name from the visible text and more', async () => {
    // How the related-product cards distinguish three links that all read
    // "See Product". The visible text has to come first and survive verbatim,
    // or speech input loses the control (WCAG 2.5.3 Label in Name).
    await renderWithRouter(
      <>
        <h3 id="name">XX99 Mark I</h3>
        <ButtonLink
          to="/product/$slug"
          params={{ slug: 'xx99-mark-one-headphones' }}
          id="cta"
          aria-labelledby="cta name"
        >
          See Product
        </ButtonLink>
      </>,
    )

    const link = screen.getByRole('link', { name: 'See Product XX99 Mark I' })
    expect(link).toHaveAttribute('href', '/product/xx99-mark-one-headphones')
  })

  it('gives sibling links distinct names, so a links list is not three of the same', async () => {
    const products = [
      { slug: 'xx99-mark-one-headphones', name: 'XX99 Mark I' },
      { slug: 'xx59-headphones', name: 'XX59' },
      { slug: 'zx9-speaker', name: 'ZX9 Speaker' },
    ]

    await renderWithRouter(
      <>
        {products.map((product) => (
          <div key={product.slug}>
            <h3 id={`related-${product.slug}`}>{product.name}</h3>
            <ButtonLink
              to="/product/$slug"
              params={{ slug: product.slug }}
              id={`see-${product.slug}`}
              aria-labelledby={`see-${product.slug} related-${product.slug}`}
            >
              See Product
            </ButtonLink>
          </div>
        ))}
      </>,
    )

    // getByRole throws when more than one link matches, so this loop is the
    // proof that the three names are distinct — not just that they exist.
    for (const product of products) {
      expect(
        screen.getByRole('link', { name: `See Product ${product.name}` }),
      ).toHaveAttribute('href', `/product/${product.slug}`)
    }
  })
})
