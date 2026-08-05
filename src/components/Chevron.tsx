/**
 * The right-facing chevron the design pairs with every "shop" affordance.
 *
 * Decorative: it always sits beside a label that names the destination, so it
 * carries no information of its own.
 *
 * Extracted at its second use rather than its third — the rule of three guards
 * against abstracting a shape that might still vary, and an icon's path data
 * cannot.
 */
export function Chevron() {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      aria-hidden="true"
    >
      <path d="M1.322 1l5 5-5 5" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}
