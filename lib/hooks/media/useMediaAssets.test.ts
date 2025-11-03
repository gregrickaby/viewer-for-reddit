import {renderHook} from '@/test-utils'
import {useMediaAssets} from './useMediaAssets'

describe('useMediaAssets', () => {
  it('returns mediumImage from resolutions', () => {
    const post = {
      preview: {
        images: [
          {
            resolutions: [
              {url: 'a.jpg', width: 100, height: 100},
              {url: 'b.jpg', width: 200, height: 200}
            ]
          }
        ]
      }
    } as any
    const {result} = renderHook(() => useMediaAssets(post))
    expect(result.current.mediumImage).toEqual({
      url: 'b.jpg',
      width: 200,
      height: 200
    })
  })

  it('returns null if no resolutions', () => {
    const post = {preview: {images: [{resolutions: []}]}} as any
    const {result} = renderHook(() => useMediaAssets(post))
    expect(result.current.mediumImage).toBe(null)
  })

  it('returns null if no images', () => {
    const post = {preview: {images: undefined}} as any
    const {result} = renderHook(() => useMediaAssets(post))
    expect(result.current.mediumImage).toBe(null)
  })

  it('returns mp4 fallbackUrl for gifv', () => {
    const post = {url: 'https://foo.com/bar.gifv'} as any
    const {result} = renderHook(() => useMediaAssets(post))
    expect(result.current.fallbackUrl).toBe('https://foo.com/bar.mp4')
  })

  it('returns video_preview fallback_url if not gifv', () => {
    const post = {
      url: 'https://foo.com/bar.mp4',
      video_preview: {fallback_url: 'https://cdn.com/vid.mp4'}
    } as any
    const {result} = renderHook(() => useMediaAssets(post))
    expect(result.current.fallbackUrl).toBe('https://cdn.com/vid.mp4')
  })

  it('returns undefined fallbackUrl if no gifv and no video_preview', () => {
    const post = {url: 'https://foo.com/bar.jpg'} as any
    const {result} = renderHook(() => useMediaAssets(post))
    expect(result.current.fallbackUrl).toBe(undefined)
  })
})
