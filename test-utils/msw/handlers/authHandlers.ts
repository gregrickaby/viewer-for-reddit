import {http, HttpResponse} from 'msw'
import {tokenMock} from '../../mocks/token'

export const authHandlers = [
  // Token endpoint
  http.post('https://www.reddit.com/api/v1/access_token', async () => {
    return HttpResponse.json(tokenMock)
  })
]
