import {render, screen} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'

vi.mock('next/server', () => ({
  connection: vi.fn(async () => undefined)
}))

import {DynamicMetadataMarker} from './DynamicMetadataMarker'

describe('DynamicMetadataMarker', () => {
  it('renders without visible output', async () => {
    render(
      <div data-testid="wrapper">
        <DynamicMetadataMarker />
      </div>
    )

    // Suspense resolves asynchronously; flush microtasks before asserting.
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(screen.getByTestId('wrapper')).toBeEmptyDOMElement()
  })
})
