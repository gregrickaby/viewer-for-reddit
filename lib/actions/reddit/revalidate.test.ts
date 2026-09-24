import {updateTag} from 'next/cache'
import {describe, expect, it, vi} from 'vitest'
import {revalidateFeeds} from './revalidate'

const mockUpdateTag = vi.mocked(updateTag)

describe('revalidateFeeds', () => {
  it('expires the shared posts cache tag', async () => {
    await revalidateFeeds()

    expect(mockUpdateTag).toHaveBeenCalledExactlyOnceWith('posts')
  })
})
