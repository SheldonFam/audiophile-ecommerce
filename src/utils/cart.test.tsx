import { act, render } from '@testing-library/react'
import { useSyncExternalStore } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addToCart,
  clearCart,
  decreaseQuantity,
  getServerSnapshot,
  getSnapshot,
  increaseQuantity,
  subscribe,
} from './cart'

const XX99 = 'xx99-mark-two-headphones'
const ZX9 = 'zx9-speaker'

/**
 * The store is the whole of this ticket, and none of it is visible — so this
 * file is where the behaviour the design cannot express is decided.
 *
 * Most tests start from a cleared cart rather than a fresh module: the store is
 * module state by design, and reloading it per test would exercise something
 * other than what ships.
 *
 * The exception is reading what was stored. Hydration happens once per page
 * load — a second one would be wrong — so testing it needs a fresh module,
 * which is what a fresh page load is.
 */
beforeEach(() => {
  localStorage.clear()
  clearCart()
})

describe('adding', () => {
  it('adds a product with the quantity asked for', () => {
    addToCart(ZX9, 3)

    expect(getSnapshot()).toEqual([{ slug: ZX9, quantity: 3 }])
  })

  it('increases the quantity of a product already held rather than replacing it', () => {
    addToCart(ZX9, 2)
    addToCart(ZX9, 3)

    // The control says "Add to Cart", and nothing already chosen is discarded.
    expect(getSnapshot()).toEqual([{ slug: ZX9, quantity: 5 }])
  })

  it('keeps products in the order they were first added', () => {
    addToCart(ZX9, 1)
    addToCart(XX99, 1)
    addToCart(ZX9, 1)

    expect(getSnapshot().map((line) => line.slug)).toEqual([ZX9, XX99])
  })

  it.each([
    ['zero', 0],
    ['negative', -1],
    ['a fraction', 1.5],
  ])('refuses a quantity that is %s', (_name, quantity) => {
    // The guard has to match the schema exactly. A stored fraction parses as
    // malformed on the next read, which empties the whole cart rather than
    // dropping the one line.
    addToCart(ZX9, quantity)

    expect(getSnapshot()).toEqual([])
  })

  it('refuses a product that is not in the catalogue', () => {
    addToCart('not-a-product', 1)

    expect(getSnapshot()).toEqual([])
  })
})

describe('changing a quantity', () => {
  it('increases one product without touching the others', () => {
    addToCart(ZX9, 1)
    addToCart(XX99, 1)

    increaseQuantity(ZX9)

    expect(getSnapshot()).toEqual([
      { slug: ZX9, quantity: 2 },
      { slug: XX99, quantity: 1 },
    ])
  })

  it('decreases a quantity', () => {
    addToCart(ZX9, 3)

    decreaseQuantity(ZX9)

    expect(getSnapshot()).toEqual([{ slug: ZX9, quantity: 2 }])
  })

  it('removes the line when its quantity would fall below one', () => {
    addToCart(ZX9, 1)
    addToCart(XX99, 1)

    decreaseQuantity(ZX9)

    // The design gives no per-line remove control, so this is the only way to
    // drop a single product.
    expect(getSnapshot()).toEqual([{ slug: XX99, quantity: 1 }])
  })

  it('ignores a product that is not in the cart', () => {
    addToCart(ZX9, 1)

    increaseQuantity(XX99)
    decreaseQuantity(XX99)

    expect(getSnapshot()).toEqual([{ slug: ZX9, quantity: 1 }])
  })
})

describe('clearing', () => {
  it('empties the cart in one action', () => {
    addToCart(ZX9, 2)
    addToCart(XX99, 1)

    clearCart()

    expect(getSnapshot()).toEqual([])
  })
})

describe('persistence', () => {
  it('writes the cart as part of each change, not later', () => {
    addToCart(ZX9, 2)

    // Read straight back out with no effect having had a chance to run: the
    // standards ban persisting in an effect precisely because an effect also
    // fires on mount and would overwrite the stored cart with an empty one.
    expect(localStorage.getItem('audiophile:cart')).toContain(ZX9)
  })

  it('writes on every kind of change', () => {
    addToCart(ZX9, 2)
    increaseQuantity(ZX9)
    expect(localStorage.getItem('audiophile:cart')).toContain('3')

    clearCart()
    expect(JSON.parse(localStorage.getItem('audiophile:cart')!)).toEqual([])
  })
})

describe('reading what was stored', () => {
  /** A fresh module, which is what arriving at the page again amounts to. */
  async function reopenWith(stored: string) {
    localStorage.setItem('audiophile:cart', stored)
    vi.resetModules()
    const store = await import('./cart')
    store.subscribe(vi.fn())
    return store
  }

  it('restores a cart saved earlier', async () => {
    const store = await reopenWith(JSON.stringify([{ slug: ZX9, quantity: 4 }]))

    expect(store.getSnapshot()).toEqual([{ slug: ZX9, quantity: 4 }])
  })

  it('tells its listeners once the stored cart has arrived', async () => {
    localStorage.setItem(
      'audiophile:cart',
      JSON.stringify([{ slug: ZX9, quantity: 4 }]),
    )
    vi.resetModules()
    const store = await import('./cart')

    const listener = vi.fn()
    store.subscribe(listener)

    // The first render matched the empty prerendered markup; this is what
    // makes the real cart appear immediately after it.
    expect(listener).toHaveBeenCalled()
  })

  it('keeps the good lines and drops one naming a product that no longer exists', async () => {
    const store = await reopenWith(
      JSON.stringify([
        { slug: ZX9, quantity: 1 },
        { slug: 'discontinued-product', quantity: 2 },
        { slug: XX99, quantity: 1 },
      ]),
    )

    expect(store.getSnapshot()).toEqual([
      { slug: ZX9, quantity: 1 },
      { slug: XX99, quantity: 1 },
    ])
  })

  it('merges two stored lines naming the same product', async () => {
    const store = await reopenWith(
      JSON.stringify([
        { slug: ZX9, quantity: 1 },
        { slug: XX99, quantity: 1 },
        { slug: ZX9, quantity: 2 },
      ]),
    )

    // Both would otherwise move together on every change, and the heading
    // would count one product twice.
    expect(store.getSnapshot()).toEqual([
      { slug: ZX9, quantity: 3 },
      { slug: XX99, quantity: 1 },
    ])
  })

  it('does not replace a cart already changed before anything subscribed', async () => {
    vi.resetModules()
    const store = await import('./cart')

    store.addToCart(XX99, 1)

    // Written after the action, because the action persists too — without this
    // storage would already agree with memory and the test would pass however
    // the store behaved.
    localStorage.setItem(
      'audiophile:cart',
      JSON.stringify([{ slug: ZX9, quantity: 9 }]),
    )
    store.subscribe(vi.fn())

    // A change makes memory the truth. Reading storage afterwards must not
    // undo it.
    expect(store.getSnapshot()).toEqual([{ slug: XX99, quantity: 1 }])
  })

  it('hydrates only once, however many things subscribe', async () => {
    const store = await reopenWith(JSON.stringify([{ slug: ZX9, quantity: 1 }]))

    store.addToCart(XX99, 1)
    store.subscribe(vi.fn())

    // A second hydration would put the stored cart back and lose the addition.
    expect(store.getSnapshot()).toEqual([
      { slug: ZX9, quantity: 1 },
      { slug: XX99, quantity: 1 },
    ])
  })

  it.each([
    ['not JSON at all', 'wat'],
    ['the wrong shape', '{"slug":"zx9-speaker"}'],
    ['a line with no quantity', '[{"slug":"zx9-speaker"}]'],
    [
      'a quantity that is not a number',
      '[{"slug":"zx9-speaker","quantity":"2"}]',
    ],
    ['a quantity below one', '[{"slug":"zx9-speaker","quantity":0}]'],
  ])('yields an empty cart when the stored value is %s', async (_n, stored) => {
    const store = await reopenWith(stored)

    expect(store.getSnapshot()).toEqual([])
  })
})

describe('when storage refuses', () => {
  /**
   * Private browsing refuses `localStorage` outright, and a full quota throws
   * on write. Neither should cost the visitor the ability to use the cart for
   * this visit — it simply will not be there next time. Both paths are catch
   * blocks, which is exactly where an untested assumption hides.
   */
  it('still adds to the cart when writing throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(() => addToCart(ZX9, 1)).not.toThrow()
    expect(getSnapshot()).toEqual([{ slug: ZX9, quantity: 1 }])
  })

  it('starts with an empty cart when reading throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    vi.resetModules()
    const store = await import('./cart')

    expect(() => store.subscribe(vi.fn())).not.toThrow()
    expect(store.getSnapshot()).toEqual([])
  })
})

describe('subscribing', () => {
  it('tells a listener when the cart changes', () => {
    const listener = vi.fn()
    subscribe(listener)
    listener.mockClear()

    addToCart(ZX9, 1)

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('stops telling a listener that has unsubscribed', () => {
    const listener = vi.fn()
    const unsubscribe = subscribe(listener)
    unsubscribe()
    listener.mockClear()

    addToCart(ZX9, 1)

    expect(listener).not.toHaveBeenCalled()
  })
})

describe('snapshots', () => {
  /**
   * ADR 0006 calls this the sharpest edge of the approach: a snapshot that is
   * a fresh array each call makes React believe the store changed on every
   * render, and it loops forever. Neither of these can be caught by looking at
   * the rendered output — the page simply hangs.
   */
  it('returns the same reference until something actually changes', () => {
    addToCart(ZX9, 1)
    const first = getSnapshot()

    expect(getSnapshot()).toBe(first)

    addToCart(XX99, 1)
    expect(getSnapshot()).not.toBe(first)
  })

  it('always answers with the same empty value when there is no browser', () => {
    expect(getServerSnapshot()).toBe(getServerSnapshot())
    expect(getServerSnapshot()).toEqual([])
  })

  it('answers with the empty value on the server even when a cart is stored', () => {
    localStorage.setItem(
      'audiophile:cart',
      JSON.stringify([{ slug: ZX9, quantity: 1 }]),
    )

    // What the prerendered HTML contains. It has to match the client's first
    // render or React discards the markup it was given.
    expect(getServerSnapshot()).toEqual([])
  })
})

describe('inside React', () => {
  /**
   * The store is designed to be read through `useSyncExternalStore`, and its
   * one catastrophic failure mode only exists there: a snapshot whose identity
   * changes on every call makes React re-render forever. The page hangs — there
   * is no wrong value to see, and no unit test of the store alone can reach it.
   *
   * So the store is driven through the hook once, which is the cheapest way to
   * know the wiring in the next ticket will not lock the browser.
   */
  it('can be read through useSyncExternalStore without re-rendering forever', async () => {
    const renders = vi.fn()

    function CartCount() {
      const lines = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot,
      )
      renders()
      return <span>{lines.length}</span>
    }

    const { findByText } = render(<CartCount />)
    await findByText('0')

    act(() => {
      addToCart(ZX9, 1)
    })
    await findByText('1')

    // A handful either way is React being React; hundreds is the loop.
    expect(renders.mock.calls.length).toBeLessThan(10)
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})
