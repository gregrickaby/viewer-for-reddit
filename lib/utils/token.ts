import type {TokenResponse} from '@/lib/types/token'

let cachedToken: TokenResponse | null = null
let requestCount = 0

const MAX_REQUESTS = 950

export function shouldFetchNewToken(
  token: TokenResponse | null = cachedToken,
  count: number = requestCount
): boolean {
  return !token || count >= MAX_REQUESTS
}

export function getRequestCount(): number {
  return requestCount
}

export function getCachedToken(): TokenResponse | null {
  return cachedToken
}

export function resetTokenState(): void {
  cachedToken = null
  requestCount = 0
}

export function setTokenState(
  token: TokenResponse | null,
  count: number = 0
): void {
  cachedToken = token
  requestCount = count
}

export function incrementRequestCount(): void {
  requestCount++
}
