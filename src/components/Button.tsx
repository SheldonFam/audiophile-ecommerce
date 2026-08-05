import { Link } from '@tanstack/react-router'
import type { ComponentProps, ReactNode } from 'react'
import { Chevron } from './Chevron'

/**
 * The three button styles from the design system frame (node 11:119).
 *
 * - `primary`   orange fill, white text        hover: lighter orange
 * - `secondary` black outline, black text      hover: black fill, white text
 * - `tertiary`  text and chevron, 50% black    hover: orange
 */
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary'

const base =
  'inline-flex items-center justify-center text-button uppercase transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black'

const variants: Record<ButtonVariant, string> = {
  primary: 'h-12 w-40 bg-orange text-white hover:bg-orange-light',
  secondary:
    'h-12 w-40 border border-black text-black hover:bg-black hover:text-white',
  tertiary: 'gap-3.5 text-black/60 hover:text-orange',
}

type ButtonProps = {
  variant?: ButtonVariant
} & ComponentProps<'button'>

export function Button({
  variant = 'primary',
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
      {variant === 'tertiary' && <Chevron />}
    </button>
  )
}

type ButtonLinkProps = {
  variant?: ButtonVariant
  children?: ReactNode
} & Omit<ComponentProps<typeof Link>, 'children'>

/**
 * Same styling, rendered as a link. Navigation is a link, not a button —
 * middle-click and "open in new tab" have to keep working.
 */
export function ButtonLink({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
      {variant === 'tertiary' && <Chevron />}
    </Link>
  )
}
