import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Without globals enabled, Testing Library does not unmount between tests, so
// renders accumulate in the document and queries see earlier tests' output.
afterEach(cleanup)
