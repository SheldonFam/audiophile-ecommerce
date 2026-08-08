import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  closeCart,
  isCartClosedOnServer,
  isCartOpen,
  openCart,
  subscribeToCartOverlay,
} from './cartOverlay'

beforeEach(() => {
  closeCart()
})

describe('the cart overlay', () => {
  it('starts closed and opens', () => {
    expect(isCartOpen()).toBe(false)

    openCart()

    expect(isCartOpen()).toBe(true)
  })

  it('tells its listeners when it opens and closes', () => {
    const listener = vi.fn()
    subscribeToCartOverlay(listener)

    openCart()
    closeCart()

    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('says nothing when asked to do what it has already done', () => {
    // Otherwise every render that opens the cart tells React the store
    // changed, which is the loop ADR 0006 warns about in the cart itself.
    const listener = vi.fn()
    subscribeToCartOverlay(listener)

    openCart()
    listener.mockClear()
    openCart()

    expect(listener).not.toHaveBeenCalled()
  })

  it('stops telling a listener that has unsubscribed', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToCartOverlay(listener)
    unsubscribe()

    openCart()

    expect(listener).not.toHaveBeenCalled()
  })

  it('is closed where there is no browser, so the markup built there matches', () => {
    openCart()

    expect(isCartClosedOnServer()).toBe(false)
  })
})
