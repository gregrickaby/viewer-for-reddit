import 'server-only'
import * as z from 'zod'

/** An optional string where a blank value (`KEY=` in a .env file) means unset. */
const optional = z.preprocess((value) => (value === '' ? undefined : value), z.string().optional())

const Env = z.object({
  BASE_URL: z.url(),
  REDDIT_CLIENT_ID: z.string().min(1),
  REDDIT_CLIENT_SECRET: z.string().min(1),
  REDDIT_REDIRECT_URI: z.url(),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  USER_AGENT: z.string().min(10),
  GOOGLE_SITE_VERIFICATION: z.string().optional(),
  // Overridable so tests can point at a mock Reddit server.
  REDDIT_API_BASE: z.url().default('https://oauth.reddit.com'),
  REDDIT_WWW_BASE: z.url().default('https://www.reddit.com'),
  // Datadog: all optional. Without them, logs go to the console and RUM stays off.
  DD_API_KEY: optional,
  DD_APPLICATION_ID: optional,
  DD_CLIENT_TOKEN: optional,
  DD_SITE: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().default('datadoghq.com'),
  ),
  DD_SERVICE: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().default('viewer-for-reddit'),
  ),
  DD_ENV: optional,
})

export type Env = z.infer<typeof Env>

function parseEnv(): Env {
  const result = Env.safeParse(process.env)
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`)
  }
  return result.data
}

export const env = parseEnv()
