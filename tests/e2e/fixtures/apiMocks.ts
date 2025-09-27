import type {Page, Route} from '@playwright/test'

interface PostResponseOptions {
  subreddit: string
  sort: string
}

const now = Math.floor(Date.now() / 1000)

function createPostResponse({subreddit, sort}: PostResponseOptions) {
  const effectiveSubreddit = subreddit === 'all' ? 'all' : subreddit
  const idBase = `${effectiveSubreddit}-${sort}`
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase()

  return {
    kind: 'Listing',
    data: {
      after: null,
      dist: 1,
      children: [
        {
          kind: 't3',
          data: {
            id: `${idBase}-id`,
            name: `t3_${idBase}`,
            author: 'playwright-bot',
            author_fullname: 't2_playwright',
            created_utc: now,
            subreddit: effectiveSubreddit,
            subreddit_name_prefixed: `r/${effectiveSubreddit}`,
            title: `${sort === 'top' ? 'Top' : 'Hot'} post in r/${effectiveSubreddit}`,
            permalink: `/r/${effectiveSubreddit}/comments/${idBase}`,
            url: 'https://example.com/cat.jpg',
            post_hint: 'image',
            preview: {
              images: [
                {
                  source: {
                    url: 'https://example.com/cat.jpg',
                    width: 1200,
                    height: 800
                  },
                  resolutions: [
                    {
                      url: 'https://example.com/cat-640.jpg',
                      width: 640,
                      height: 427
                    }
                  ]
                }
              ]
            },
            thumbnail: 'https://example.com/cat-thumb.jpg',
            stickied: false,
            over_18: false,
            is_self: false,
            is_video: false,
            locked: false,
            spoiler: false,
            ups: sort === 'top' ? 9876 : 1234,
            score: sort === 'top' ? 9876 : 1234,
            num_comments: sort === 'top' ? 321 : 56,
            media: null,
            media_embed: {}
          }
        }
      ]
    }
  }
}

const popularSubredditsResponse = {
  kind: 'Listing',
  data: {
    after: null,
    dist: 2,
    children: [
      {
        kind: 't5',
        data: {
          display_name: 'aww',
          icon_img: 'https://example.com/icons/aww.png',
          over18: false,
          subscribers: 123456,
          public_description: 'Cute things to brighten your day.'
        }
      },
      {
        kind: 't5',
        data: {
          display_name: 'cats',
          icon_img: 'https://example.com/icons/cats.png',
          over18: false,
          subscribers: 654321,
          public_description: 'All about cats.'
        }
      }
    ]
  }
}

const searchSubredditsResponse = {
  kind: 'Listing',
  data: {
    after: null,
    dist: 3,
    children: [
      {
        kind: 't5',
        data: {
          display_name: 'cats',
          icon_img: 'https://example.com/icons/cats.png',
          over18: false,
          subscribers: 654321,
          public_description: 'All about cats.'
        }
      },
      {
        kind: 't5',
        data: {
          display_name: 'CatsStandingUp',
          icon_img: 'https://example.com/icons/standing.png',
          over18: false,
          subscribers: 321000,
          public_description: 'Cats standing like humans.'
        }
      },
      {
        kind: 't5',
        data: {
          display_name: 'CatSlaps',
          icon_img: 'https://example.com/icons/slaps.png',
          over18: false,
          subscribers: 111000,
          public_description: 'Cats throwing paws.'
        }
      }
    ]
  }
}

function fulfillment(route: Route, body: unknown) {
  return route.fulfill({
    status: 200,
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json'
    }
  })
}

export async function mockRedditApi(page: Page) {
  await page.route('**/api/reddit', async (route) => {
    const url = new URL(route.request().url())
    const rawPath = url.searchParams.get('path')

    if (!rawPath) {
      await route.fulfill({
        status: 400,
        body: JSON.stringify({error: 'Missing path parameter'}),
        headers: {'content-type': 'application/json'}
      })
      return
    }

    const path = decodeURIComponent(rawPath)

    if (path.startsWith('/subreddits/popular')) {
      await fulfillment(route, popularSubredditsResponse)
      return
    }

    if (path.startsWith('/api/subreddit_autocomplete_v2')) {
      const query = url.searchParams.get('query')

      // Return empty results for specific test queries
      if (query === 'nonexistentsubreddit12345') {
        await fulfillment(route, {
          kind: 'Listing',
          data: {
            after: null,
            dist: 0,
            children: []
          }
        })
        return
      }

      await fulfillment(route, searchSubredditsResponse)
      return
    }

    const subredditMatch = path.match(/^\/(?:r|user)\/([^/]+)\/([^.]+)\.json/i)
    if (subredditMatch && path.startsWith('/r/')) {
      const [, rawSubreddit, sort] = subredditMatch
      const subreddit = rawSubreddit.split('+')[0]
      await fulfillment(route, createPostResponse({subreddit, sort}))
      return
    }

    await route.fulfill({
      status: 404,
      body: JSON.stringify({error: 'Unhandled Reddit API path', path}),
      headers: {'content-type': 'application/json'}
    })
  })
}
