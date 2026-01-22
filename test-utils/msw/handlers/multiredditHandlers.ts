import {http, HttpResponse} from 'msw'

export const multiredditHandlers = [
  // Fetch user's multireddits
  http.get('https://oauth.reddit.com/api/multi/mine.json', () => {
    return HttpResponse.json([
      {
        data: {
          name: 'tech',
          display_name: 'Tech News',
          path: '/user/testuser/m/tech',
          subreddits: [{name: 'programming'}, {name: 'technology'}],
          icon_url: 'https://example.com/tech-icon.png'
        }
      },
      {
        data: {
          name: 'gaming',
          display_name: 'Gaming',
          path: '/user/testuser/m/gaming',
          subreddits: [{name: 'gaming'}, {name: 'pcgaming'}]
        }
      }
    ])
  }),

  // Multireddit with no subreddits (edge case)
  http.get(
    'https://oauth.reddit.com/api/multi/user/:username/m/:multiname',
    ({params}) => {
      const {multiname} = params

      if (multiname === 'empty') {
        return HttpResponse.json({
          data: {
            name: 'empty',
            display_name: 'Empty Multi',
            path: '/user/testuser/m/empty',
            subreddits: []
          }
        })
      }

      return HttpResponse.json({
        data: {
          name: multiname,
          display_name: 'Test Multi',
          path: `/user/testuser/m/${multiname}`,
          subreddits: [{name: 'test1'}, {name: 'test2'}]
        }
      })
    }
  )
]
