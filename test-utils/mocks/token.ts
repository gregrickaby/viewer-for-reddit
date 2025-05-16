import type {TokenResponse} from '@/lib/types/token'

export const tokenMock: TokenResponse = {
  access_token: 'test_access_token',
  expires_in: 86400,
  scope: '*',
  token_type: 'bearer'
}

export const emptyTokenMock: TokenResponse = {
  access_token: '',
  error: expect.any(String),
  expires_in: 0,
  scope: '',
  token_type: ''
}
