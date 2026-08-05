import { useId } from 'react'
import type { ComponentProps } from 'react'

/**
 * Text input with the three states from the design system frame (node 11:145):
 * default (grey border), focus (orange border), error (2px red border with the
 * label and message in red).
 *
 * Error styling is driven by the `error` prop rather than `:invalid`, because
 * `:invalid` matches before the user has touched the field. See the validation
 * rule in CODING_STANDARDS.md.
 */
type TextFieldProps = {
  label: string
  error?: string
} & Omit<ComponentProps<'input'>, 'id' | 'aria-invalid' | 'aria-describedby'>

export function TextField({
  label,
  error,
  className = '',
  ...props
}: TextFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-baseline justify-between gap-4">
        <label
          htmlFor={id}
          className={`text-label ${error ? 'text-error' : 'text-black'}`}
        >
          {label}
        </label>
        {error && (
          <span id={errorId} className="text-label text-error font-medium">
            {error}
          </span>
        )}
      </div>

      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`text-input caret-orange h-14 rounded-lg bg-white px-6 text-black placeholder:text-black/40 focus:outline-none ${
          error
            ? 'border-error border-2'
            : 'border-border focus:border-orange border'
        }`}
        {...props}
      />
    </div>
  )
}
