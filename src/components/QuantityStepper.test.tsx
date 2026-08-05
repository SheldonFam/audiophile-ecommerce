import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { QuantityStepper } from './QuantityStepper'

/**
 * One of the few components in this feature with behaviour rather than only
 * appearance, so it is tested where the rest are not.
 *
 * Rendered with real state rather than a mock callback, so assertions are about
 * the number a visitor sees rather than how it got there.
 */
function Harness({ initial = 1 }: { initial?: number }) {
  const [quantity, setQuantity] = useState(initial)
  return <QuantityStepper value={quantity} onChange={setQuantity} />
}

const quantity = () => screen.getByRole('spinbutton', { name: /quantity/i })
const decrease = () => screen.getByRole('button', { name: /decrease/i })
const increase = () => screen.getByRole('button', { name: /increase/i })

describe('QuantityStepper', () => {
  it('exposes the quantity as a value rather than as loose text', () => {
    render(<Harness initial={3} />)

    expect(quantity()).toHaveValue(3)
  })

  it('increases the quantity', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(increase())

    expect(quantity()).toHaveValue(2)
  })

  it('decreases the quantity', async () => {
    const user = userEvent.setup()
    render(<Harness initial={3} />)

    await user.click(decrease())

    expect(quantity()).toHaveValue(2)
  })

  it('will not go below one', async () => {
    const user = userEvent.setup()
    render(<Harness initial={2} />)

    await user.click(decrease())
    await user.click(decrease())

    expect(quantity()).toHaveValue(1)
  })

  it('counts every increase even when two land in one render pass', () => {
    render(<Harness />)

    // Deliberately inside a single act: React batches both, so a component
    // computing `value + 1` from its prop would derive both from the same
    // stale 1 and land on 2. This is the case the updater form exists for, and
    // clicking through userEvent cannot produce it — each of those flushes.
    act(() => {
      fireEvent.click(increase())
      fireEvent.click(increase())
    })

    expect(quantity()).toHaveValue(3)
  })

  it('keeps the decrease control focusable at one, rather than dropping focus', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(decrease())

    expect(decrease()).toHaveAttribute('aria-disabled', 'true')
    expect(decrease()).not.toBeDisabled()
  })
})
