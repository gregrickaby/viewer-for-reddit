import {fromAbout, fromPopular, fromSearch} from './subredditMapper'

describe('subredditMapper', () => {
  it('should map fromSearch correctly', () => {
    const input = {
      display_name: 'foo',
      icon_img: 'img',
      over18: true,
      subscribers: 42,
      public_description: 'desc'
    }
    expect(fromSearch(input as any)).toEqual({
      display_name: 'foo',
      icon_img: 'img',
      over18: true,
      value: 'r/foo',
      subscribers: 42,
      public_description: 'desc',
      fromSearch: true
    })
  })

  it('should map fromPopular correctly', () => {
    const input = {
      display_name: 'bar',
      icon_img: 'img2',
      over18: false,
      subscribers: 100,
      public_description: 'desc2'
    }
    expect(fromPopular(input as any)).toEqual({
      display_name: 'bar',
      icon_img: 'img2',
      over18: false,
      value: 'r/bar',
      subscribers: 100,
      public_description: 'desc2'
    })
  })

  it('should map fromAbout correctly', () => {
    const input = {
      display_name: 'baz',
      icon_img: 'img3',
      over18: false,
      subscribers: 0,
      public_description: ''
    }
    expect(fromAbout(input as any)).toEqual({
      display_name: 'baz',
      icon_img: 'img3',
      over18: false,
      value: 'r/baz',
      subscribers: 0,
      public_description: ''
    })
  })

  it('should handle missing fields', () => {
    expect(fromSearch({} as any)).toEqual({
      display_name: '',
      icon_img: undefined,
      over18: false,
      value: 'r/',
      subscribers: 0,
      public_description: '',
      fromSearch: true
    })
  })
})
