/**
 * What an order costs, and how that is written.
 *
 * This module is Seam 1 from ADR 0001. `calculateTotals` is pure — it looks
 * nothing up and touches nothing outside itself — so if the project later
 * grows a server, the server imports this very function rather than a second
 * implementation of it, and the price a visitor sees cannot disagree with the
 * price they are charged.
 *
 * Prices in this catalogue are whole dollars, so the figures come out whole
 * and the formatter shows no cents. That is a fact about the data rather than
 * a contract: a server handing this fractional prices would get a fractional
 * total, which the formatter would then quietly round for display.
 */
const format = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

/** `2999` becomes `$ 2,999` — the spacing after the sign is the design's. */
export function formatPrice(amount: number): string {
  return `$ ${format.format(amount)}`
}

/** Charged once per order, not per item. */
const SHIPPING = 50

/** Displayed, never added. See `calculateTotals`. */
const VAT_RATE = 0.2

export type OrderLine = { price: number; quantity: number }

export type OrderTotals = {
  total: number
  shipping: number
  vat: number
  grandTotal: number
}

/**
 * The four figures the cart and the checkout summary show.
 *
 * The trap is the tax. The design labels its row "(INCLUDED)", meaning it is
 * already inside the prices rather than added to them — so it is shown and
 * never summed. Adding it to the reference order gives 6,525 instead of 5,446,
 * and both look entirely plausible on a page. `CODING_STANDARDS.md` writes the
 * arithmetic out for that reason.
 *
 * An empty order costs nothing, shipping included: quoting a delivery fee for
 * an empty cart would be wrong, and making every caller special-case it would
 * be worse.
 */
export function calculateTotals(items: ReadonlyArray<OrderLine>): OrderTotals {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Nothing to send, nothing to charge for sending it. Keyed on the order
  // being empty rather than on the money coming to zero: the two agree for
  // this catalogue and are not the same rule, and a server handing this its
  // own prices could have a free line that still has to be delivered.
  const shipping = items.length === 0 ? 0 : SHIPPING

  return {
    total,
    shipping,
    vat: Math.round(total * VAT_RATE),
    grandTotal: total + shipping,
  }
}
