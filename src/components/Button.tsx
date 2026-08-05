import { createLink } from '@tanstack/react-router'
import type { ComponentProps, ComponentPropsWithoutRef } from 'react'
import { Chevron } from './Chevron'

/**
 * The three button styles from the design system frame (node 11:119), plus
 * one the frame does not draw.
 *
 * - `primary`   orange fill, white text        hover: lighter orange
 * - `secondary` black outline, black text      hover: black fill, white text
 * - `tertiary`  text and chevron, 50% black    hover: orange
 * - `inverse`   black fill, white text        hover: lighter black
 *
 * `inverse` exists for the home page's orange panel, where an orange fill would
 * disappear into its background. It is the only place the design uses it.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'inverse'

const base =
  'inline-flex items-center justify-center text-button uppercase transition-colors'

/**
 * ADR 0010: the ring is chosen against the surface it will actually appear on.
 * A button is not always on white — the hero sits on a photograph — and black
 * on that measures about 1.2, which is no indicator at all. Expressed as a prop
 * rather than a class a caller passes, because two utilities both setting
 * `outline` would be resolved by their order in the stylesheet rather than by
 * the order they are written in.
 */
const surfaces = {
  light: 'focus-ring',
  dark: 'focus-ring-on-dark',
} as const

export type ButtonSurface = keyof typeof surfaces

const variants: Record<ButtonVariant, string> = {
  primary: 'h-12 w-40 bg-orange text-white hover:bg-orange-light',
  secondary:
    'h-12 w-40 border border-black text-black hover:bg-black hover:text-white',
  tertiary: 'gap-3.5 text-black/60 hover:text-orange-text',
  inverse: 'h-12 w-40 bg-black text-white hover:bg-black-light',
}

type ButtonProps = {
  variant?: ButtonVariant
  surface?: ButtonSurface
} & ComponentProps<'button'>

export function Button({
  variant = 'primary',
  surface = 'light',
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${surfaces[surface]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
      {variant === 'tertiary' && <Chevron />}
    </button>
  )
}

// `href` is omitted because createLink derives it from `to`/`params`; a caller
// passing one directly would bypass the router and the type checking with it.
type ButtonAnchorProps = {
  variant?: ButtonVariant
  surface?: ButtonSurface
} & Omit<ComponentPropsWithoutRef<'a'>, 'href'>

function ButtonAnchor({
  variant = 'primary',
  surface = 'light',
  className = '',
  children,
  ...props
}: ButtonAnchorProps) {
  return (
    <a
      className={`${base} ${surfaces[surface]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
      {variant === 'tertiary' && <Chevron />}
    </a>
  )
}

/**
 * Same styling, rendered as a link. Navigation is a link, not a button —
 * middle-click and "open in new tab" have to keep working.
 *
 * Built with `createLink` rather than by wrapping `Link` directly. Wrapping it
 * types the props as `ComponentProps<typeof Link>`, which erases the router's
 * generics: `to` degrades to a plain string and `params` to a reducer, so
 * linking to any route with a parameter fails to type-check. `createLink` is
 * the supported way to keep a custom component's `to`/`params` checked against
 * the real route tree.
 *
 * TanStack's example wraps the created link once more to inject defaults such
 * as `preload`. There are none to inject here, so that wrapper would only
 * delegate.
 */
export const ButtonLink = createLink(ButtonAnchor)
