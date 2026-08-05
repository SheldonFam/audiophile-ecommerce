import { useId } from 'react'

/**
 * The quantity control from the design system frame.
 *
 * The value is a real number input rather than a styled span. A span needed a
 * live region to announce changes, which is the wrong tool — `role="status"` is
 * for asynchronous messages, not a value the visitor just changed, and it
 * announces a bare digit after every press. A native input exposes the value
 * without any of that.
 *
 * It is read-only because the design offers no typing affordance, and clamping
 * on each keystroke makes typing hostile: clearing the field snaps it to one,
 * so the next digits append to that. The buttons are the way to change it.
 *
 * The decrease control uses `aria-disabled` rather than `disabled`. A keyboard
 * user stepping down to one would otherwise have the focused button disabled
 * underneath them and focus dropped to the document.
 *
 * `onChange` takes an updater so the next value is derived when it is applied
 * rather than from whatever this component last rendered, and so the clamp
 * lives with the arithmetic instead of resting on the control's own state.
 */
type QuantityStepperProps = {
  value: number
  onChange: (update: (current: number) => number) => void
}

const MINIMUM = 1

export function QuantityStepper({ value, onChange }: QuantityStepperProps) {
  const id = useId()
  const atMinimum = value <= MINIMUM

  return (
    <div className="bg-grey flex h-12 w-30 shrink-0 items-center">
      <button
        type="button"
        aria-label="Decrease quantity"
        aria-disabled={atMinimum}
        onClick={() => {
          if (atMinimum) return
          onChange((current) => Math.max(MINIMUM, current - 1))
        }}
        className="text-button focus-ring not-aria-disabled:hover:text-orange-text h-full px-4 text-black/60 transition-colors aria-disabled:text-black/25"
      >
        &minus;
      </button>

      <label htmlFor={id} className="sr-only">
        Quantity
      </label>
      <input
        id={id}
        type="number"
        min={MINIMUM}
        value={value}
        readOnly
        // The design draws a plain number, so the input carries no chrome of
        // its own — no border, no spinners.
        className="text-button focus-ring no-spinner w-full bg-transparent text-center text-black"
      />

      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange((current) => current + 1)}
        className="text-button focus-ring hover:text-orange-text h-full px-4 text-black/60 transition-colors"
      >
        +
      </button>
    </div>
  )
}
