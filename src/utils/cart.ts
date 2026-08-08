import { z } from 'zod'
import { getProduct } from './products'

/**
 * What the visitor has chosen, and the only place it lives.
 *
 * A plain external store rather than React state, per ADR 0006: the cart is
 * read from the header, the overlay and the checkout summary at once, and it
 * has to survive a reload. Nothing here imports React, so all of it is
 * testable without rendering anything.
 *
 * Two rules from that ADR are structural rather than matters of care:
 *
 * - **Persisting happens inside each action.** An effect watching the cart
 *   would also fire on mount and write the empty starting cart over the stored
 *   one, which is how persistence silently stops working.
 * - **A snapshot keeps its identity until the cart actually changes.** React
 *   compares snapshots by reference; handing back a fresh array each call means
 *   it believes the store changed on every render, and it loops forever.
 */

const STORAGE_KEY = 'audiophile:cart'

const CartLine = z.object({
  slug: z.string(),
  // A line at zero is a line that should not exist — decreasing past one
  // removes it — so a stored zero is malformed rather than empty.
  quantity: z.number().int().positive(),
})

export type CartLine = z.infer<typeof CartLine>
export type Cart = ReadonlyArray<CartLine>

/**
 * One array, returned forever. `getServerSnapshot` must give the same value
 * every time it is asked or React sees a change where there is none.
 */
const EMPTY: Cart = []

let cart: Cart = EMPTY
let hydrated = false
const listeners = new Set<() => void>()

function publish(next: Cart) {
  cart = next
  // Anything that changed the cart makes memory the truth, so a first
  // subscription arriving afterwards must not replace it with what was stored.
  // Unreachable while React subscribes before any control can be pressed, but
  // it costs a line to stop depending on that.
  hydrated = true
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage can be full or refused outright in private browsing. The cart
    // still works for this visit; it simply will not be there next time,
    // which is a better outcome than failing to add to it at all.
  }
  for (const listener of listeners) listener()
}

/**
 * Reads what was stored, keeping the lines that still name a real product and
 * dropping the rest.
 *
 * The value is written by us but lives on the visitor's machine, so it arrives
 * as untrusted input: hand-edited, left over from an older catalogue, or
 * corrupt. ADR 0005's posture applies — parse at the boundary so that nothing
 * downstream has to defend itself.
 *
 * A dropped line is silent. A cart is not worth interrupting someone over, and
 * the rest of it still works.
 */
function readStored(): Cart {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return EMPTY
  }
  if (!raw) return EMPTY

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return EMPTY
  }

  const result = z.array(CartLine).safeParse(parsed)
  if (!result.success) return EMPTY

  // Two lines naming one product parse cleanly and are still wrong: every
  // action matches by slug, so both would move at once and the count would
  // read twice. Merging them here is what "nothing downstream has to defend
  // itself" means — downstream cannot defend against this one.
  const merged = new Map<string, number>()
  for (const line of result.data) {
    if (!getProduct(line.slug)) continue
    merged.set(line.slug, (merged.get(line.slug) ?? 0) + line.quantity)
  }

  return [...merged].map(([slug, quantity]) => ({ slug, quantity }))
}

/**
 * Deliberately not at module load. The prerendered HTML is built where there
 * is no browser, so it contains an empty cart; reading storage before the
 * first client render would make the two disagree and React would throw the
 * markup away. Hydrating on the first subscription instead means the first
 * render matches, and the stored cart arrives immediately after.
 */
function hydrateOnce() {
  if (hydrated) return
  hydrated = true

  const stored = readStored()
  if (stored.length > 0) {
    cart = stored
    for (const listener of listeners) listener()
  }
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  hydrateOnce()

  return () => {
    listeners.delete(listener)
  }
}

/** The cart as it is now. The same reference until something changes it. */
export function getSnapshot(): Cart {
  return cart
}

/** What the cart is where there is no browser to ask. Always the same value. */
export function getServerSnapshot(): Cart {
  return EMPTY
}

/**
 * Adds to what is already there rather than replacing it. The control says
 * "Add to Cart", and nothing the visitor chose earlier is discarded.
 *
 * A slug that names no product is refused: the cart's rows are drawn by
 * looking the product up, so a line that cannot be resolved could never be
 * shown, only counted.
 */
export function addToCart(slug: string, quantity: number) {
  // Exactly what the schema accepts. A looser guard here lets a fraction be
  // stored, and the next read rejects the whole array — costing the visitor
  // their entire cart rather than one line.
  if (!Number.isInteger(quantity) || quantity < 1) return
  if (!getProduct(slug)) return

  const existing = cart.find((line) => line.slug === slug)

  publish(
    existing
      ? cart.map((line) =>
          line.slug === slug
            ? { ...line, quantity: line.quantity + quantity }
            : line,
        )
      : [...cart, { slug, quantity }],
  )
}

export function increaseQuantity(slug: string) {
  if (!cart.some((line) => line.slug === slug)) return

  publish(
    cart.map((line) =>
      line.slug === slug ? { ...line, quantity: line.quantity + 1 } : line,
    ),
  )
}

/**
 * Below one, the line goes. The design draws no per-line remove control, so
 * this is the only way to drop a single product.
 */
export function decreaseQuantity(slug: string) {
  const existing = cart.find((line) => line.slug === slug)
  if (!existing) return

  publish(
    existing.quantity > 1
      ? cart.map((line) =>
          line.slug === slug ? { ...line, quantity: line.quantity - 1 } : line,
        )
      : cart.filter((line) => line.slug !== slug),
  )
}

export function clearCart() {
  publish(EMPTY)
}
