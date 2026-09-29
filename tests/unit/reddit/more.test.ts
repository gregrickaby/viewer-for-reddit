import { describe, expect, it, vi } from 'vitest'
import { type FlatNode, MAX_CHILDREN, resolveMore } from '@/lib/reddit/more'
import type { CommentNode, CommentView } from '@/lib/view-models'

const comment = (id: string, replies: CommentNode[] = []): CommentNode => ({
  kind: 'comment',
  comment: { id, fullname: `t1_${id}` } as CommentView,
  replies,
})
const more = (id: string, parentId: string, children: string[]): CommentNode => ({
  kind: 'more',
  id,
  parentId,
  depth: 1,
  count: children.length,
  children,
})
const flat = (parentId: string, node: CommentNode): FlatNode => ({ parentId, node })

/** Comment ids in document order, with `more:<id>` for placeholders. */
function outline(nodes: CommentNode[]): string[] {
  return nodes.flatMap((node) =>
    node.kind === 'more'
      ? [`more:${node.id}`]
      : [node.comment.id, ...outline(node.replies).map((id) => `  ${id}`)],
  )
}

describe('resolveMore', () => {
  it('leaves the tree alone when nothing is expanded', async () => {
    const fetchChildren = vi.fn()
    const tree = [comment('a', [more('m1', 't1_a', ['b'])])]
    expect(await resolveMore(tree, [], fetchChildren)).toBe(tree)
    expect(await resolveMore(tree, ['other'], fetchChildren)).toBe(tree)
    expect(fetchChildren).not.toHaveBeenCalled()
  })

  it('splices fetched replies in place and assembles nested ones', async () => {
    const tree = [comment('a', [comment('x'), more('m1', 't1_a', ['b', 'c', 'd'])]), comment('z')]
    const fetchChildren = vi.fn(async () => [
      flat('t1_a', comment('b')),
      flat('t1_b', comment('c')),
      flat('t1_a', comment('d')),
    ])
    const result = await resolveMore(tree, ['m1'], fetchChildren)
    expect(fetchChildren).toHaveBeenCalledWith(['b', 'c', 'd'])
    expect(outline(result)).toEqual(['a', '  x', '  b', '    c', '  d', 'z'])
  })

  it('resolves several placeholders in one call and keeps others', async () => {
    const tree = [
      comment('a', [more('m1', 't1_a', ['b'])]),
      comment('c', [more('m2', 't1_c', ['d'])]),
      more('m3', 't3_post', ['e']),
    ]
    const fetchChildren = vi.fn(async () => [
      flat('t1_a', comment('b')),
      flat('t1_c', comment('d')),
    ])
    const result = await resolveMore(tree, ['m1', 'm2'], fetchChildren)
    expect(fetchChildren).toHaveBeenCalledOnce()
    expect(outline(result)).toEqual(['a', '  b', 'c', '  d', 'more:m3'])
  })

  it('follows newly revealed placeholders that were also expanded', async () => {
    const tree = [comment('a', [more('m1', 't1_a', ['b'])])]
    const fetchChildren = vi
      .fn()
      .mockResolvedValueOnce([flat('t1_a', comment('b')), flat('t1_b', more('m2', 't1_b', ['c']))])
      .mockResolvedValueOnce([flat('t1_b', comment('c'))])
    const result = await resolveMore(tree, ['m1', 'm2'], fetchChildren)
    expect(fetchChildren).toHaveBeenCalledTimes(2)
    expect(outline(result)).toEqual(['a', '  b', '    c'])
  })

  it('takes at most 100 children per call and keeps the rest for the next round', async () => {
    const ids = Array.from({ length: MAX_CHILDREN + 30 }, (_, i) => `k${i}`)
    const tree = [more('big', 't3_post', ids)]
    const fetchChildren = vi.fn(async (children: string[]) =>
      children.map((id) => flat('t3_post', comment(id))),
    )
    const result = await resolveMore(tree, ['big'], fetchChildren)
    expect(fetchChildren.mock.calls.map(([children]) => children.length)).toEqual([100, 30])
    expect(result).toHaveLength(130)
  })

  it('stops after three rounds and leaves any remainder as a placeholder', async () => {
    const ids = Array.from({ length: MAX_CHILDREN * 4 }, (_, i) => `k${i}`)
    const tree = [more('huge', 't3_post', ids)]
    const fetchChildren = vi.fn(async (children: string[]) =>
      children.map((id) => flat('t3_post', comment(id))),
    )
    const result = await resolveMore(tree, ['huge'], fetchChildren)
    expect(fetchChildren).toHaveBeenCalledTimes(3)
    const last = result.at(-1)!
    expect(last).toMatchObject({ kind: 'more', id: 'huge', count: 100 })
  })

  it('does not repeat a subtree for a second placeholder under the same parent', async () => {
    const tree = [comment('a', [more('m1', 't1_a', ['b']), more('m2', 't1_a', ['c'])])]
    const fetchChildren = vi.fn(async () => [
      flat('t1_a', comment('b')),
      flat('t1_a', comment('c')),
    ])
    const result = await resolveMore(tree, ['m1', 'm2'], fetchChildren)
    expect(outline(result)).toEqual(['a', '  b', '  c'])
  })

  it('ignores continue-this-thread markers, which have no children', async () => {
    const tree = [comment('a', [more('deep', 't1_a', [])])]
    const fetchChildren = vi.fn()
    await resolveMore(tree, ['deep'], fetchChildren)
    expect(fetchChildren).not.toHaveBeenCalled()
  })
})
