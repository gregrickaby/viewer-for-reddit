import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mapComment, mapCommentTree } from '@/lib/reddit/mappers/comment'
import { mapMe, mapMulti, mapSubreddit, mapUser } from '@/lib/reddit/mappers/community'
import { mapPost } from '@/lib/reddit/mappers/post'
import {
  appPath,
  distinguishedFrom,
  editedAt,
  flairFrom,
  hexColor,
  removalFrom,
  toVote,
} from '@/lib/reddit/mappers/shared'
import { Account, Me } from '@/lib/reddit/schemas/account'
import { Comment } from '@/lib/reddit/schemas/comment'
import { Link } from '@/lib/reddit/schemas/link'
import { Multi } from '@/lib/reddit/schemas/multi'
import { Subreddit } from '@/lib/reddit/schemas/subreddit'
import { type Sample, sample, samples } from '@/tests/helpers/fixtures'
import type { CommentNode } from '@/lib/view-models'

beforeEach(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

describe('shared mapping rules', () => {
  it('maps likes to votes', () => {
    expect([toVote(true), toVote(false), toVote(null), toVote(undefined)]).toEqual([1, -1, 0, 0])
  })

  it('reads edit times', () => {
    expect([editedAt(false), editedAt(true), editedAt(1_700_000_000)]).toEqual([
      null,
      null,
      1_700_000_000,
    ])
  })

  it('classifies removals', () => {
    expect(removalFrom(null)).toBeNull()
    expect(removalFrom('')).toBeNull()
    expect(removalFrom('deleted')).toBe('deleted')
    expect(removalFrom('moderator')).toBe('removed')
    expect(removalFrom('content_takedown')).toBe('removed')
  })

  it('only badges moderators and admins', () => {
    expect([
      distinguishedFrom('moderator'),
      distinguishedFrom('admin'),
      distinguishedFrom('special'),
      distinguishedFrom(null),
    ]).toEqual(['moderator', 'admin', null, null])
  })

  it('only allows hex colors into style attributes', () => {
    expect(hexColor('#FF4500')).toBe('#FF4500')
    expect(hexColor('#abc')).toBe('#abc')
    expect(hexColor('')).toBeNull()
    expect(hexColor('red')).toBeNull()
    expect(hexColor('#fff;background:url(x)')).toBeNull()
  })

  it('builds flair only when it has text', () => {
    expect(flairFrom('  Discussion ', '#0079d3', 'light')).toEqual({
      text: 'Discussion',
      backgroundColor: '#0079d3',
      textColor: 'light',
    })
    expect(flairFrom('Tip', '', 'dark')).toEqual({
      text: 'Tip',
      backgroundColor: null,
      textColor: 'dark',
    })
    expect(flairFrom('Tip', null, null)?.textColor).toBe('dark')
    expect(flairFrom('   ', '#fff', 'dark')).toBeNull()
    expect(flairFrom(null, null, null)).toBeNull()
  })

  it('turns permalinks into app routes', () => {
    expect(appPath('/r/pics/comments/abc/title/', '/x')).toBe('/r/pics/comments/abc/title')
    expect(appPath('https://www.reddit.com/r/pics/comments/abc/title/def/', '/x')).toBe(
      '/r/pics/comments/abc/title/def',
    )
    expect(appPath('/r/pics/wiki/', '/fallback')).toBe('/fallback')
    expect(appPath(undefined, '/fallback')).toBe('/fallback')
  })
})

describe('mapPost', () => {
  const post = (predicate: (value: Sample) => boolean, edit?: (value: Sample) => void) => {
    const value = sample('Link', predicate)
    edit?.(value)
    return mapPost(Link.parse(value))
  }

  it('maps an image post', () => {
    const raw = sample('Link', (v) => v.post_hint === 'image' && v.over_18 === false)
    const view = mapPost(Link.parse(raw))
    expect(view).toMatchObject({
      id: raw.id,
      fullname: `t3_${String(raw.id)}`,
      subreddit: raw.subreddit,
      author: raw.author,
      title: raw.title,
      score: raw.score,
      numComments: raw.num_comments,
      removal: null,
      body: null,
      crosspostFrom: null,
      media: { type: 'image' },
    })
    expect(view.permalink).toMatch(
      new RegExp(`^/r/${String(raw.subreddit)}/comments/${String(raw.id)}/`),
    )
    expect(view.permalink.endsWith('/')).toBe(false)
  })

  it('sanitizes self text', () => {
    const view = post(
      (v) => v.is_self === true && !v.removed_by_category && Boolean(v.selftext_html),
    )
    expect(view.body).toMatch(/^<p>/)
    expect(view.body).not.toContain('SC_OFF')
    expect(view.media).toEqual({ type: 'none' })
  })

  it('hides the body of a removed post and says why', () => {
    const view = post((v) => Boolean(v.removed_by_category))
    expect(view.removal).toBe('removed')
    expect(view.body).toBeNull()
  })

  it('maps deleted authors, votes, flags, flair, and distinguished posts', () => {
    const view = post(
      (v) => v.author === '[deleted]',
      (v) => {
        Object.assign(v, {
          likes: false,
          over_18: true,
          spoiler: true,
          stickied: true,
          locked: true,
          archived: true,
          edited: 1_700_000_100,
          distinguished: 'moderator',
          link_flair_text: 'Meta',
          link_flair_background_color: '#ff4500',
          link_flair_text_color: 'light',
        })
      },
    )
    expect(view).toMatchObject({
      author: null,
      likes: -1,
      editedUtc: 1_700_000_100,
      distinguished: 'moderator',
      flags: { nsfw: true, spoiler: true, stickied: true, locked: true, archived: true },
      flair: { text: 'Meta', backgroundColor: '#ff4500', textColor: 'light' },
    })
  })

  it('attributes a crosspost and borrows the original’s text', () => {
    const original = sample(
      'Link',
      (v) => v.is_self === true && !v.removed_by_category && Boolean(v.selftext_html),
    )
    const view = post(
      (v) => v.is_self === false && v.id !== original.id,
      (v) => {
        v.selftext_html = null
        v.crosspost_parent_list = [original]
      },
    )
    expect(view.crosspostFrom).toEqual({
      subreddit: original.subreddit,
      author: original.author,
      permalink: expect.stringMatching(new RegExp(`/comments/${String(original.id)}/`)),
    })
    expect(view.body).toMatch(/^<p>/)
    expect(view.media).toEqual({ type: 'none' })
  })

  it('falls back to a canonical path for odd permalinks', () => {
    const view = post(
      () => true,
      (v) => {
        v.permalink = '/r/x/wiki/y'
      },
    )
    expect(view.permalink).toMatch(/^\/r\/[^/]+\/comments\/[a-z0-9]+$/)
  })
})

describe('mapComment', () => {
  const comment = (predicate: (value: Sample) => boolean, edit?: (value: Sample) => void) => {
    const value = sample('Comment', predicate)
    edit?.(value)
    return mapComment(Comment.parse(value))
  }

  it('maps a thread comment', () => {
    const raw = sample('Comment', (v) => typeof v.edited === 'number')
    const view = mapComment(Comment.parse(raw))
    expect(view).toMatchObject({
      id: raw.id,
      fullname: `t1_${String(raw.id)}`,
      author: raw.author,
      editedUtc: raw.edited,
      depth: raw.depth,
      removal: null,
      context: null,
    })
    expect(view.body).toMatch(/^<p>/)
    expect(view.permalink).toMatch(/^\/r\/[^/]+\/comments\/[a-z0-9]+\/[^/]*\/[a-z0-9]+$/)
  })

  it('badges moderators and shows author flair', () => {
    expect(comment((v) => v.distinguished === 'moderator').distinguished).toBe('moderator')
    expect(comment((v) => Boolean(v.author_flair_text)).flair?.text).toBeTruthy()
  })

  it.each([
    ['deleted by its author', (v: Sample) => v.body === '[deleted]', 'deleted'],
    ['removed by Reddit', (v: Sample) => v.body === '[ Removed by Reddit ]', 'removed'],
  ])('hides a comment %s', (_, predicate, removal) => {
    const view = comment(predicate)
    expect(view.removal).toBe(removal)
    expect(view.body).toBeNull()
  })

  it('hides a comment removed by moderators', () => {
    const view = comment(
      () => true,
      (v) => {
        v.body = '[removed]'
        v.author = '[deleted]'
      },
    )
    expect(view).toMatchObject({ removal: 'removed', author: null, body: null })
  })

  it('marks the viewer’s own comments and exposes their markdown for editing', () => {
    const raw = sample(
      'Comment',
      (v) => v.body !== '[deleted]' && !String(v.body).startsWith('[ Removed'),
    )
    const mine = mapComment(Comment.parse(raw), String(raw.author).toUpperCase())
    expect(mine).toMatchObject({ mine: true, bodyMarkdown: raw.body })
    expect(mapComment(Comment.parse(raw), 'someone_else')).toMatchObject({
      mine: false,
      bodyMarkdown: null,
    })
    expect(mapComment(Comment.parse(raw))).toMatchObject({ mine: false, bodyMarkdown: null })
  })

  it('never offers editing on a removed comment', () => {
    const raw = sample('Comment', (v) => v.body === '[ Removed by Reddit ]')
    expect(mapComment(Comment.parse(raw), String(raw.author)).mine).toBe(false)
  })

  it('links a saved comment back to its post', () => {
    const raw = sample('Comment', (v) => typeof v.link_title === 'string')
    const view = mapComment(Comment.parse(raw))
    expect(view.context).toEqual({
      postTitle: raw.link_title,
      postPermalink: expect.stringMatching(/^\/r\/[^/]+\/comments\//),
      subreddit: raw.subreddit,
    })
    expect(view.depth).toBe(0)
  })
})

describe('mapCommentTree', () => {
  const thing = (kind: string, data: Sample) => ({ kind, data })
  const listing = (children: unknown[]) => ({
    kind: 'Listing',
    data: { after: null, before: null, children },
  })

  it('builds nested replies and keeps more placeholders', () => {
    const [top, reply, nested] = samples('Comment')
    const more = sample('More', (v) => (v.count as number) > 0)
    nested!.replies = ''
    reply!.replies = listing([thing('t1', nested!)])
    top!.replies = listing([thing('t1', reply!), thing('more', more)])

    const tree = mapCommentTree(listing([thing('t1', top!)]), '/comments/x')
    expect(tree).toHaveLength(1)
    const [root] = tree as [Extract<CommentNode, { kind: 'comment' }>]
    expect(root.comment.id).toBe(top!.id)
    expect(root.replies.map((node) => node.kind)).toEqual(['comment', 'more'])
    const [first, placeholder] = root.replies
    expect(first?.kind === 'comment' && first.replies[0]?.kind).toBe('comment')
    expect(placeholder).toEqual({
      kind: 'more',
      id: more.id,
      parentId: more.parent_id,
      depth: more.depth,
      count: more.count,
      children: more.children,
    })
  })

  it('degrades malformed replies to none and drops bad children', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const [top, other] = samples('Comment')
    top!.replies = { kind: 'Listing' }
    other!.replies = 42
    const tree = mapCommentTree(
      listing([thing('t1', top!), thing('t1', other!), thing('t1', { id: 'broken' })]),
      '/comments/x',
    )
    expect(tree).toHaveLength(2)
    expect(tree.every((node) => node.kind === 'comment' && node.replies.length === 0)).toBe(true)
    expect(warn).toHaveBeenCalledTimes(2)
  })
})

describe('communities, people, and multis', () => {
  it('maps a subscribed community with its icon and color', () => {
    const raw = sample(
      'Subreddit',
      (v) => v.user_is_subscriber === true && Boolean(v.community_icon),
    )
    const view = mapSubreddit(Subreddit.parse(raw))
    expect(view).toMatchObject({
      name: raw.display_name,
      fullname: `t5_${String(raw.id)}`,
      href: `/r/${String(raw.display_name)}`,
      kind: 'community',
      subscribed: true,
      icon: expect.stringMatching(/^https:\/\/styles\.redditmedia\.com\//),
    })
    expect(view.color).toMatch(/^#/)
  })

  it('tolerates a private community with little data', () => {
    const raw = sample('Subreddit', (v) => v.subreddit_type === 'private')
    const view = mapSubreddit(Subreddit.parse(raw))
    expect(view).toMatchObject({ subscribed: false, favorited: false, icon: null })
  })

  it('maps a followed user to their profile', () => {
    const raw = sample('Subreddit')
    Object.assign(raw, {
      subreddit_type: 'user',
      display_name: 'u_spez',
      community_icon: '',
      icon_img: 'https://styles.redditmedia.com/t5_1/styles/profileIcon.png',
      primary_color: '',
      key_color: '#ff4500',
      subscribers: null,
      over18: null,
      quarantine: null,
    })
    expect(mapSubreddit(Subreddit.parse(raw))).toMatchObject({
      name: 'spez',
      href: '/user/spez',
      kind: 'user',
      icon: 'https://styles.redditmedia.com/t5_1/styles/profileIcon.png',
      color: '#ff4500',
      subscribers: null,
      nsfw: false,
      quarantined: false,
    })
  })

  it('maps a user profile', () => {
    const raw = sample('Account')
    const view = mapUser(Account.parse(raw))
    expect(view).toMatchObject({
      name: raw.name,
      fullname: `t2_${String(raw.id)}`,
      karma: { total: raw.total_karma, post: raw.link_karma, comment: raw.comment_karma },
      followed: expect.any(Boolean),
    })
    expect(view.icon).toMatch(/^https:/)
  })

  it('fills in what a sparse profile leaves out', () => {
    const raw = sample('Account')
    for (const key of [
      'total_karma',
      'verified',
      'is_gold',
      'subreddit',
      'snoovatar_img',
      'icon_img',
    ])
      delete raw[key]
    const view = mapUser(Account.parse(raw))
    expect(view).toMatchObject({
      karma: { total: (raw.link_karma as number) + (raw.comment_karma as number) },
      verified: false,
      premium: false,
      followed: false,
      bio: null,
      nsfw: false,
      icon: null,
    })
  })

  it('maps the signed-in user', () => {
    const raw = sample('Me')
    expect(mapMe(Me.parse(raw))).toEqual({
      name: 'fixture_user',
      icon: expect.stringMatching(/^https:/),
    })
  })

  it('routes the viewer’s own multis to /m and others to their owner', () => {
    const raw = sample('LabeledMulti')
    const multi = Multi.parse(raw)
    const own = mapMulti(multi, 'FIXTURE_USER')
    expect(own).toMatchObject({
      name: raw.name,
      owner: 'fixture_user',
      href: `/m/${String(raw.name)}`,
      visibility: 'private',
      canEdit: true,
    })
    expect(own.subreddits.length).toBeGreaterThan(0)
    expect(mapMulti(multi, 'someone_else').href).toBe(`/user/fixture_user/m/${String(raw.name)}`)
  })

  it('keeps known visibilities and defaults the rest to private', () => {
    const raw = sample('LabeledMulti')
    const visibility = (value: string) =>
      mapMulti(Multi.parse({ ...raw, visibility: value }), 'x').visibility
    expect([visibility('public'), visibility('hidden'), visibility('secret')]).toEqual([
      'public',
      'hidden',
      'private',
    ])
    const bare = Multi.parse({ ...raw, description_md: undefined, over_18: undefined })
    expect(mapMulti(bare, 'x')).toMatchObject({ descriptionMd: '', nsfw: false })
  })
})
