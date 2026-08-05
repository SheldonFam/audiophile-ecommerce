import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Without globals enabled, Testing Library does not unmount between tests, so
// renders accumulate in the document and queries see earlier tests' output.
afterEach(cleanup)

/**
 * jsdom 30 does not implement `<dialog>` — `showModal` is undefined.
 *
 * This shim adds only enough for a test to observe that a component opened and
 * closed a dialog: the `open` attribute, and a `close` event.
 *
 * It deliberately does NOT simulate focus containment, background inertness,
 * Escape-to-cancel, or focus restoration. Those are the reasons ADR 0007 chose
 * `<dialog>` in the first place, they are supplied by the browser, and a test
 * asserting them here would be testing this shim rather than the platform.
 * They are verified in a real browser instead.
 */
// Typed as partial because the whole point is that this runtime lacks members
// the DOM lib promises are there.
const dialogPrototype =
  HTMLDialogElement.prototype as Partial<HTMLDialogElement>

if (!dialogPrototype.showModal) {
  dialogPrototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  dialogPrototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}
