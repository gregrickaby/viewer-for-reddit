import {extractChildren} from './extractChildren'

describe('extractChildren', () => {
  it('returns an array of child data when present', () => {
    const response = {
      data: {
        children: [{data: {id: 1, name: 'foo'}}, {data: {id: 2, name: 'bar'}}]
      }
    }
    expect(extractChildren(response)).toEqual([
      {id: 1, name: 'foo'},
      {id: 2, name: 'bar'}
    ])
  })

  it('filters out children with undefined data', () => {
    const response = {
      data: {
        children: [{data: {id: 1}}, {data: undefined}, {}]
      }
    }
    expect(extractChildren(response)).toEqual([{id: 1}])
  })

  it('returns an empty array if children is missing', () => {
    const response = {data: {}}
    expect(extractChildren(response)).toEqual([])
  })

  it('returns an empty array if data is missing', () => {
    const response = {}
    expect(extractChildren(response)).toEqual([])
  })

  it('returns an empty array if children is an empty array', () => {
    const response = {data: {children: []}}
    expect(extractChildren(response)).toEqual([])
  })
})
