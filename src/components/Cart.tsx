import { useEffect, useRef, useSyncExternalStore } from 'react'
import { getSnapshot, getServerSnapshot, subscribe } from '@/utils/cart'
import { cartDisplay } from '@/utils/cartDisplay'
import {
  closeCart,
  isCartClosedOnServer,
  isCartOpen,
  subscribeToCartOverlay,
} from '@/utils/cartOverlay'
import { formatPrice } from '@/utils/pricing'
import { getProduct } from '@/utils/products'

/**
 * The cart, over the page.
 *
 * It opens two ways — the header's control, and adding something from a
 * product page — because the design gives the header no count badge, so
 * opening is the only thing that can show an addition worked.
 *
 * A modal `<dialog>` per ADR 0007, which brings focus containment, an inert
 * page behind it and Escape without any of it being hand-rolled. Escape
 * arrives as `close`, which is also what the visible control triggers, so the
 * two cannot drift apart. `closedby="any"` adds light dismiss: without it the
 * modal makes the page inert and a pointer user's only way out is a control
 * they may not have found.
 *
 * Quantity controls and the total arrive in the next ticket. This shows what
 * is in the cart.
 */
// React's DOM types predate `closedby`, so it is passed through rather than
// written as a prop. Browsers without it ignore it, and Escape still closes.
const lightDismiss = { closedby: 'any' } as Record<string, string>

export function Cart() {
  const dialog = useRef<HTMLDialogElement>(null)
  const open = useSyncExternalStore(
    subscribeToCartOverlay,
    isCartOpen,
    isCartClosedOnServer,
  )
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    const element = dialog.current
    if (!open || !element) return

    element.showModal()

    const handleClose = () => closeCart()
    element.addEventListener('close', handleClose)

    return () => {
      element.removeEventListener('close', handleClose)
      // Undo the promotion to the top layer, not merely the listener.
      element.close()
    }
  }, [open])

  if (!open) return null

  return (
    <dialog
      ref={dialog}
      aria-labelledby="cart-heading"
      {...lightDismiss}
      // Full width and transparent, with the panel inside a container, so it
      // lands on the content column's right edge at every breakpoint rather
      // than being positioned against the viewport. It sits 24 below the
      // header on a phone and tablet and 32 below it on a desktop, which is
      // where the design puts it — the header is 90 tall below xl and 97 at it.
      className="mt-28.5 w-full max-w-none bg-transparent backdrop:bg-black/40 xl:mt-32.25"
    >
      <div className="max-w-content mx-auto px-6 md:px-10 xl:px-0">
        <div className="ml-auto w-full rounded-lg bg-white p-8 text-black md:max-w-94.25">
          <div className="flex items-center justify-between">
            <h2 id="cart-heading" className="text-h6">
              {/* The design counts distinct products, not units: three lines
                  of 1, 2 and 1 read "CART (3)". */}
              Cart ({lines.length})
            </h2>
          </div>

          {lines.length === 0 ? (
            <p className="text-body mt-8 text-black/60">Your cart is empty.</p>
          ) : (
            <ul role="list" className="mt-8 flex flex-col gap-6">
              {lines.map((line) => {
                const product = getProduct(line.slug)
                const display = cartDisplay(line.slug)
                if (!product || !display) return null

                return (
                  <li key={line.slug} className="flex items-center gap-4">
                    <img
                      src={display.thumbnail}
                      alt=""
                      width={64}
                      height={64}
                      className="size-16 shrink-0 rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-bold">{display.label}</p>
                      <p className="text-line-price text-black/60">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                    <span className="text-body font-bold text-black/60">
                      x{line.quantity}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </dialog>
  )
}
