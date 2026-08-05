import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Header } from './Header'
import { renderWithRouter } from '@/test/renderWithRouter'

/**
 * The menu is one of the few components in this feature with behaviour rather
 * than only appearance, so it is tested where the rest are not.
 *
 * Scope note: jsdom does not implement `<dialog>`, and `src/test/setup.ts`
 * shims only the `open` attribute and the `close` event. So these tests cover
 * the wiring this component owns — what opens it, what closes it, and that both
 * routes end in the same state. Focus containment, background inertness,
 * Escape-to-cancel and focus restoration come from the browser; asserting them
 * against the shim would prove nothing, so they are checked in a real browser.
 */
function menuButton() {
  return screen.getByRole('button', { name: /categories menu/i })
}

describe('Header', () => {
  it('reaches the home page through the logo', async () => {
    await renderWithRouter(<Header />)

    expect(screen.getByRole('link', { name: /audiophile/i })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('offers every destination inline for a wide screen', async () => {
    await renderWithRouter(<Header />)

    const nav = screen.getByRole('navigation', { name: /primary/i })

    expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      '/',
    )
    for (const category of ['headphones', 'speakers', 'earphones']) {
      expect(within(nav).getByRole('link', { name: category })).toHaveAttribute(
        'href',
        `/category/${category}`,
      )
    }
  })

  it('keeps the menu closed until asked', async () => {
    await renderWithRouter(<Header />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens the menu from the menu control', async () => {
    const user = userEvent.setup()
    await renderWithRouter(<Header />)

    await user.click(menuButton())

    expect(await screen.findByRole('dialog')).toBeVisible()
    expect(menuButton()).toHaveAttribute('aria-expanded', 'true')
  })

  it('offers every category once the menu is open', async () => {
    const user = userEvent.setup()
    await renderWithRouter(<Header />)
    await user.click(menuButton())

    const dialog = await screen.findByRole('dialog')

    for (const category of ['headphones', 'speakers', 'earphones']) {
      expect(
        within(dialog).getByRole('link', { name: new RegExp(category, 'i') }),
      ).toHaveAttribute('href', `/category/${category}`)
    }
  })

  it('closes the menu when a destination is chosen', async () => {
    const user = userEvent.setup()
    await renderWithRouter(<Header />)
    await user.click(menuButton())
    const dialog = await screen.findByRole('dialog')

    await user.click(within(dialog).getByRole('link', { name: /headphones/i }))

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('returns to the closed state whenever the dialog reports closing', async () => {
    const user = userEvent.setup()
    await renderWithRouter(<Header />)
    await user.click(menuButton())
    const dialog = await screen.findByRole('dialog')

    // What Escape does in a browser: the dialog closes and reports it. A
    // component listening only to its own button would be left claiming the
    // menu is still open.
    ;(dialog as HTMLDialogElement).close()

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false')
  })
})
