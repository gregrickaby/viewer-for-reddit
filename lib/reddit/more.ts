import 'server-only'
import type { CommentNode, MoreNode } from '@/lib/view-models'

/*
 * Expanding "load more" nodes on the server (design §8.3). The URL lists the
 * `more` ids the reader expanded; each round fetches their children with one
 * `/api/morechildren` call and splices the results into the tree in place.
 */

/** URL cap on expanded `more` ids, and Reddit's cap on children per call. */
export const MAX_EXPANDED = 20
export const MAX_CHILDREN = 100
const MAX_ROUNDS = 3

/** One fetched thing and the fullname of its parent (`t1_…` or `t3_…`). */
export type FlatNode = { parentId: string; node: CommentNode }

export type FetchChildren = (childIds: string[]) => Promise<FlatNode[]>

export async function resolveMore(
  tree: CommentNode[],
  moreIds: readonly string[],
  fetchChildren: FetchChildren,
): Promise<CommentNode[]> {
  const wanted = new Set(moreIds.slice(0, MAX_EXPANDED))
  let current = tree

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const targets = findMore(current, wanted)
    if (targets.length === 0) break

    const childIds: string[] = []
    // Resolved `more` id → children left for a later round (Reddit takes 100 per call).
    const resolving = new Map<string, string[]>()
    for (const target of targets) {
      const room = MAX_CHILDREN - childIds.length
      if (room === 0) break
      childIds.push(...target.children.slice(0, room))
      const leftover = target.children.slice(room)
      resolving.set(target.id, leftover)
      if (leftover.length === 0) wanted.delete(target.id)
    }

    const fetched = assemble(await fetchChildren(childIds))
    current = splice(current, resolving, fetched)
  }

  return current
}

/** `more` nodes in the tree whose ids were asked for, in document order. */
function findMore(nodes: CommentNode[], wanted: ReadonlySet<string>): MoreNode[] {
  const found: MoreNode[] = []
  const visit = (list: CommentNode[]) => {
    for (const node of list) {
      if (node.kind === 'more') {
        if (wanted.has(node.id) && node.children.length > 0) found.push(node)
      } else {
        visit(node.replies)
      }
    }
  }
  visit(nodes)
  return found
}

/**
 * Builds subtrees from Reddit's flat, depth-first list: each thing is attached
 * to its parent when the parent is also in the list. Returns the roots grouped
 * by parent fullname, in Reddit's order.
 */
function assemble(flat: FlatNode[]): Map<string, CommentNode[]> {
  const byFullname = new Map<string, Extract<CommentNode, { kind: 'comment' }>>()
  for (const { node } of flat) {
    if (node.kind === 'comment') byFullname.set(node.comment.fullname, node)
  }

  const roots = new Map<string, CommentNode[]>()
  for (const { parentId, node } of flat) {
    const parent = byFullname.get(parentId)
    if (parent) parent.replies.push(node)
    else roots.set(parentId, [...(roots.get(parentId) ?? []), node])
  }
  return roots
}

/** Replaces each resolved `more` node with the fetched subtrees under the same parent. */
function splice(
  nodes: CommentNode[],
  resolving: ReadonlyMap<string, string[]>,
  fetched: Map<string, CommentNode[]>,
): CommentNode[] {
  return nodes.flatMap((node): CommentNode[] => {
    if (node.kind === 'more') {
      const leftover = resolving.get(node.id)
      if (!leftover) return [node]
      const subtrees = fetched.get(node.parentId) ?? []
      // Claim them, so a second `more` under the same parent doesn't repeat them.
      fetched.delete(node.parentId)
      return leftover.length > 0
        ? [...subtrees, { ...node, count: leftover.length, children: leftover }]
        : subtrees
    }
    return [{ ...node, replies: splice(node.replies, resolving, fetched) }]
  })
}
