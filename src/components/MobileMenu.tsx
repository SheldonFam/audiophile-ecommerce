import { useEffect, useRef, useState } from 'react'
import { CategoryCards } from './CategoryCards'

/**
 * The menu behind the header's control on phone and tablet.
 *
 * It does not show a list of links: the design puts the three category cards
 * over a dimmed page. Home is reached through the logo, which is why there are
 * three destinations here rather than four.
 *
 * `showModal()` supplies focus containment, an inert background and Escape
 * (ADR 0007) — none of which is worth hand-rolling. Escape arrives as `close`,
 * which also covers a programmatic close, so there is one exit rather than two
 * that can disagree.
 *
 * `closedby="any"` adds light dismiss. Without it the modal makes the header
 * inert, so a pointer user's only way out would be to navigate somewhere —
 * Escape rescues the keyboard and strands everyone else. The design draws no
 * close control, but ADR 0007 already holds that a design's omission is not
 * permission to strand.
 */
// React's DOM types predate `closedby`, so it is passed through rather than
// written as a prop. Browsers without it simply ignore it, and Escape still
// closes the dialog.
const lightDismiss = { closedby: 'any' } as Record<string, string>

export function MobileMenu() {
  const dialog = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)

  // The dialog is only in the tree once open, so this is the first moment it
  // can be shown. The close listener is attached here rather than through
  // React's onClose only because addEventListener is unambiguous about a
  // non-bubbling event; React 19 does support onClose.
  useEffect(() => {
    const element = dialog.current
    if (!open || !element) return

    element.showModal()

    const handleClose = () => setOpen(false)
    element.addEventListener('close', handleClose)

    return () => {
      element.removeEventListener('close', handleClose)
      // Undo the promotion to the top layer, not just the listener.
      element.close()
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        aria-label="Categories menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        // Padding rather than a bare 16px icon, so the target clears 24x24
        // without relying on WCAG 2.5.8's spacing exception.
        className="focus-ring-on-dark -m-1.5 shrink-0 p-1.5 xl:hidden"
      >
        <img
          src="/assets/shared/tablet/icon-hamburger.svg"
          alt=""
          width={16}
          height={15}
        />
      </button>

      {open && (
        <dialog
          ref={dialog}
          aria-label="Categories"
          {...lightDismiss}
          className="mt-22.5 w-full max-w-none rounded-b-lg bg-white px-6 pt-14 pb-9 text-black backdrop:bg-black/40 md:px-10"
        >
          <nav aria-label="Categories">
            <CategoryCards
              // Navigating leaves the header mounted, so the dialog would stay
              // open over the new page. close() runs while it is still mounted,
              // which is what lets the browser restore focus to the control;
              // setOpen then unmounts it.
              onChoose={() => {
                dialog.current?.close()
                setOpen(false)
              }}
            />
          </nav>
        </dialog>
      )}
    </>
  )
}
