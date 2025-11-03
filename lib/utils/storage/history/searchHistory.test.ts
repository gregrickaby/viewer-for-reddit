import type {SubredditItem} from '@/lib/types'
import {
  addToSearchHistory,
  clearSearchHistory,
  removeFromSearchHistory
} from '@/lib/utils/storage/history/searchHistory'

const mockSubreddit1: SubredditItem = {
  display_name: 'pics',
  icon_img: '',
  over18: false,
  public_description: 'Pictures',
  subscribers: 100000,
  value: 'r/pics'
}

const mockSubreddit2: SubredditItem = {
  display_name: 'aww',
  icon_img: '',
  over18: false,
  public_description: 'Cute things',
  subscribers: 50000,
  value: 'r/aww'
}

const mockNsfwSubreddit: SubredditItem = {
  display_name: 'nsfw',
  icon_img: '',
  over18: true,
  public_description: 'Adult content',
  subscribers: 75000,
  value: 'r/nsfw'
}

describe('searchHistory utils', () => {
  describe('addToSearchHistory', () => {
    it('should add subreddit to empty history', () => {
      const result = addToSearchHistory([], mockSubreddit1)
      expect(result).toEqual([mockSubreddit1])
    })

    it('should add subreddit to beginning of history', () => {
      const history = [mockSubreddit2]
      const result = addToSearchHistory(history, mockSubreddit1)
      expect(result).toEqual([mockSubreddit1, mockSubreddit2])
    })

    it('should move existing subreddit to beginning', () => {
      const history = [mockSubreddit1, mockSubreddit2]
      const result = addToSearchHistory(history, mockSubreddit2)
      expect(result).toEqual([mockSubreddit2, mockSubreddit1])
    })

    it('should limit history to maximum of 10 items', () => {
      const history = Array.from({length: 10}, (_, i) => ({
        ...mockSubreddit1,
        display_name: `sub${i}`,
        value: `r/sub${i}`
      }))
      const newSubreddit = {
        ...mockSubreddit1,
        display_name: 'new',
        value: 'r/new'
      }
      const result = addToSearchHistory(history, newSubreddit)

      expect(result).toHaveLength(10)
      expect(result[0]).toEqual(newSubreddit)
      expect(result).not.toContain(history[9]) // Last item should be removed
    })

    it('should handle NSFW subreddits', () => {
      const result = addToSearchHistory([], mockNsfwSubreddit)
      expect(result).toEqual([mockNsfwSubreddit])
    })
  })

  describe('removeFromSearchHistory', () => {
    it('should remove subreddit from history', () => {
      const history = [mockSubreddit1, mockSubreddit2]
      const result = removeFromSearchHistory(history, 'r/pics')
      expect(result).toEqual([mockSubreddit2])
    })

    it('should return same history if subreddit not found', () => {
      const history = [mockSubreddit1, mockSubreddit2]
      const result = removeFromSearchHistory(history, 'r/notfound')
      expect(result).toEqual(history)
    })

    it('should return empty array when removing last item', () => {
      const history = [mockSubreddit1]
      const result = removeFromSearchHistory(history, 'r/pics')
      expect(result).toEqual([])
    })
  })

  describe('clearSearchHistory', () => {
    it('should return empty array', () => {
      const result = clearSearchHistory()
      expect(result).toEqual([])
    })
  })
})
