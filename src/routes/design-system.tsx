import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/Button'
import { ResponsiveImage } from '@/components/ResponsiveImage'
import { TextField } from '@/components/TextField'
import { getProduct } from '@/utils/products'
import type { ImageSource } from '@/utils/products'

export const Route = createFileRoute('/design-system')({
  component: DesignSystem,
})

// Shared assets are not in products.json, so this triple is written by hand.
// Annotated so it is checked against the same type the data module produces.
const BEST_GEAR: ImageSource = {
  mobile: '/assets/shared/mobile/image-best-gear.jpg',
  tablet: '/assets/shared/tablet/image-best-gear.jpg',
  desktop: '/assets/shared/desktop/image-best-gear.jpg',
}

const TYPE = [
  ['text-h1', 'H1 — 56/58, 2px'],
  ['text-h2', 'H2 — 40/44, 1.43px'],
  ['text-h3', 'H3 — 32/36, 1.14px'],
  ['text-h4', 'H4 — 28/38, 2px'],
  ['text-h5', 'H5 — 24/33, 1.71px'],
  ['text-h6', 'H6 — 18/24, 1.29px'],
  ['text-overline', 'Overline — 14/19, 10px'],
  ['text-subtitle', 'Subtitle — 13/25, 0.93px'],
] as const

const COLORS = [
  ['bg-orange', '#D87D4A'],
  ['bg-orange-light', '#FBAF85'],
  ['bg-black', '#101010'],
  ['bg-grey', '#F1F1F1'],
  ['bg-off-white', '#FAFAFA'],
  ['bg-white border border-border', '#FFFFFF'],
  ['bg-pure-black', '#000000'],
  ['bg-error', '#CD2C2C'],
] as const

function DesignSystem() {
  const zx9 = getProduct('zx9-speaker')

  return (
    <main className="max-w-content mx-auto px-6 py-16">
      <h1 className="text-h4 mb-12">Design System</h1>

      <section className="mb-16">
        <h2 className="text-overline text-orange mb-8">01 Colors</h2>
        <ul className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {COLORS.map(([cls, hex]) => (
            <li key={hex}>
              <div className={`h-24 rounded-lg ${cls}`} />
              <p className="text-subtitle mt-3">{hex}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-16">
        <h2 className="text-overline text-orange mb-8">02 Typography</h2>
        <ul className="space-y-8">
          {TYPE.map(([cls, spec]) => (
            <li key={cls}>
              <p className="text-body mb-1 text-black/50">{spec}</p>
              <p className={cls}>Morbi interdum mollis sapien</p>
            </li>
          ))}
          <li>
            <p className="text-body mb-1 text-black/50">Body — 15/25</p>
            <p className="text-body max-w-prose">
              Lorem ipsum dolor sit amet, consectetuer adipiscing elit.
              Phasellus hendrerit. Pellentesque aliquet nibh nec urna. In nisi
              neque, aliquet vel, dapibus id, mattis vel, nisi.
            </p>
          </li>
        </ul>
      </section>

      <section className="mb-16">
        <h2 className="text-overline text-orange mb-8">03 Buttons</h2>
        <div className="flex flex-wrap items-center gap-8">
          <Button variant="primary">See Product</Button>
          <Button variant="secondary">See Product</Button>
          <Button variant="tertiary">Shop</Button>
        </div>
        <p className="text-body mt-4 text-black/50">
          Hover each to check states.
        </p>
      </section>

      <section>
        <h2 className="text-overline text-orange mb-8">04 Form Elements</h2>
        <div className="grid max-w-2xl gap-8 md:grid-cols-2">
          <TextField label="Name" placeholder="Insert your name" />
          <TextField label="Name" defaultValue="Alexei" />
          <TextField
            label="Name"
            defaultValue="!@#!@$!@"
            error="Wrong format"
          />
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-overline text-orange mb-8">05 Responsive Image</h2>
        <p className="text-body mb-6 text-black/50">
          Resize across 48rem and 80rem — the crop changes, not just the scale.
          Below 48rem it is near-square, to 80rem a wide banner, above that
          portrait.
        </p>
        <ResponsiveImage
          image={BEST_GEAR}
          alt=""
          className="w-full rounded-lg object-cover"
        />

        {zx9 && (
          <>
            <p className="text-body mt-8 mb-6 text-black/50">
              Consuming the product data module directly, with no reshaping:
            </p>
            <ResponsiveImage
              image={zx9.image}
              alt="ZX9 Speaker"
              className="w-full max-w-sm rounded-lg"
            />
          </>
        )}
      </section>
    </main>
  )
}
