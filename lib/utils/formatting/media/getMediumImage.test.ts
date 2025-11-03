import {getMediumImage} from './getMediumImage'

describe('getMediumImage', () => {
  it('returns null if images is not an array', () => {
    expect(getMediumImage(undefined as any)).toBeNull()
    expect(getMediumImage(null as any)).toBeNull()
  })

  it('returns null if images is an empty array', () => {
    expect(getMediumImage([])).toBeNull()
  })

  it('returns the image with width 640 if present', () => {
    const images = [
      {width: 320, url: 'small.jpg'},
      {width: 640, url: 'medium.jpg'},
      {width: 1280, url: 'large.jpg'}
    ]
    expect(getMediumImage(images)).toEqual({width: 640, url: 'medium.jpg'})
  })

  it('returns the last image if no medium size found', () => {
    const images = [
      {width: 320, url: 'small.jpg'},
      {width: 1280, url: 'large.jpg'}
    ]
    expect(getMediumImage(images)).toEqual({width: 1280, url: 'large.jpg'})
  })
})
