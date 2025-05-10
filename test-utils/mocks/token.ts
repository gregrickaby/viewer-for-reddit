import type {OAuthResponse} from '@/lib/types'

export const tokenMock: OAuthResponse = {
  access_token: 'test_access_token',
  expires_in: 86400,
  scope: '*',
  token_type: 'bearer'
}

export const emptyTokenMock: OAuthResponse = {
  access_token: '',
  error: expect.any(String),
  expires_in: 0,
  scope: '',
  token_type: ''
}
