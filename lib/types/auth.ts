/**
 * App-level token type returned by Reddit OAuth operations.
 *
 * Matches the shape of Arctic's OAuth2Tokens without exposing Arctic as a
 * dependency to callers. Any file that handles tokens imports this type
 * instead of importing directly from Arctic.
 */
export interface AuthTokens {
  /**
   * Returns the OAuth access token string.
   *
   * @returns The access token
   */
  accessToken: () => string

  /**
   * Returns the OAuth refresh token string, or undefined if the provider did
   * not issue one.
   *
   * @returns The refresh token, or undefined
   */
  refreshToken: () => string | undefined

  /**
   * Returns the date at which the access token expires.
   *
   * @returns Expiration date
   */
  accessTokenExpiresAt: () => Date
}
