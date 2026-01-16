interface TokenResponse {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
  error?: string
}

export const tokenMock: TokenResponse = {
  access_token: 'test_access_token',
  expires_in: 86400,
  scope: '*',
  token_type: 'bearer'
}

export const emptyTokenMock: TokenResponse = {
  access_token: '',
  error: '',
  expires_in: 0,
  scope: '',
  token_type: ''
}
