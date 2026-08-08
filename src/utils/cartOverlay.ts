/**
 * Whether the cart is on screen.
 *
 * Kept apart from the cart's contents on purpose. ADR 0006 notes that putting
 * cart data and overlay state in one place means opening the overlay
 * re-renders everything reading the cart; they change for different reasons
 * and at different times.
 *
 * It is a store rather than React state because the two things that open the
 * cart — the header's control and the product page's Add to Cart — are in
 * different trees, and the same reasoning as ADR 0006 applies: no provider,
 * no React in the module.
 */
let open = false
const listeners = new Set<() => void>()

function publish(next: boolean) {
  if (next === open) return
  open = next
  for (const listener of listeners) listener()
}

export function subscribeToCartOverlay(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function isCartOpen() {
  return open
}

/** Closed on the server, which is where the prerendered markup comes from. */
export function isCartClosedOnServer() {
  return false
}

export function openCart() {
  publish(true)
}

export function closeCart() {
  publish(false)
}
