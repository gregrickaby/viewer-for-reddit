import { describe, expect, it } from 'vitest'
import { FIXTURE_USER, scrub, scrubMe } from '@/scripts/reddit/scrub'

describe('fixture scrubbing', () => {
  it('replaces the username everywhere, case-insensitively, as a whole word', () => {
    const input = {
      author: 'GregR',
      permalink: '/user/gregr/saved',
      title: 'gregrickaby is not gregr',
      modhash: 'secret',
    }
    expect(scrub(input, 'GregR')).toEqual({
      author: FIXTURE_USER,
      permalink: `/user/${FIXTURE_USER}/saved`,
      title: `gregrickaby is not ${FIXTURE_USER}`,
    })
  })

  it('escapes regex characters in usernames', () => {
    expect(scrub({ a: 'a-b.c' }, 'a-b.c')).toEqual({ a: FIXTURE_USER })
  })

  it('keeps only public fields from /api/v1/me', () => {
    const me = {
      name: 'GregR',
      id: '1',
      total_karma: 5,
      pref_nightmode: true,
      coins: 9,
      inbox_count: 3,
    }
    expect(scrubMe(me, 'GregR')).toEqual({ name: FIXTURE_USER, id: '1', total_karma: 5 })
  })
})
