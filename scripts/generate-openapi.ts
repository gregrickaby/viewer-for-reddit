import {execSync} from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import https from 'node:https'
import path from 'node:path'
import {Reddit} from 'arctic'

const OAUTH_BASE_URL = 'https://oauth.reddit.com'
const SCOPES = ['identity', 'read', 'mysubreddits']

function generateSelfSignedCert(): {key: string; cert: string} {
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'codegen-'))
  const keyPath = path.join(dir, 'key.pem')
  const certPath = path.join(dir, 'cert.pem')

  execSync(
    `openssl req -x509 -newkey rsa:2048 -keyout ${keyPath} -out ${certPath} -days 1 -nodes -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost"`,
    {stdio: 'ignore'}
  )

  const key = fs.readFileSync(keyPath, 'utf8')
  const cert = fs.readFileSync(certPath, 'utf8')
  fs.rmSync(dir, {recursive: true})

  return {key, cert}
}

// Load .env.local for standalone scripts (Next.js handles this automatically in the app)
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

interface EndpointConfig {
  path: string
  method: 'GET' | 'POST'
  operationId: string
  summary: string
  tags: string[]
  parameters?: Array<{
    name: string
    in: 'path' | 'query' | 'header'
    required?: boolean
    schema: {type: string; enum?: string[]}
  }>
  sampleUrls: string[]
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET
  const redirectUri = process.env.REDDIT_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'Missing REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, or REDDIT_REDIRECT_URI in .env.local'
    )
  }

  const redirectUrl = new URL(redirectUri)
  const port = Number(redirectUrl.port) || 3000

  const reddit = new Reddit(clientId, clientSecret, redirectUri)
  const state = crypto.randomUUID()
  const authUrl = reddit.createAuthorizationURL(state, SCOPES)

  console.log('\n📋 Open this URL in your browser to log in:\n')
  console.log(`   ${authUrl.toString()}\n`)

  // Open browser automatically
  const open =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'start'
        : 'xdg-open'
  try {
    execSync(`${open} "${authUrl.toString()}"`, {stdio: 'ignore'})
  } catch {
    // Browser may not be available in all environments
  }

  return new Promise<string>((resolve, reject) => {
    const {key, cert} = generateSelfSignedCert()
    const server = https.createServer({key, cert}, async (req, res) => {
      try {
        const url = new URL(req.url!, `http://localhost:${port}`)

        if (url.pathname !== '/api/auth/callback/reddit') {
          res.writeHead(404)
          res.end('Not found')
          return
        }

        const code = url.searchParams.get('code')
        const error = url.searchParams.get('error')

        if (error) {
          res.writeHead(400, {'Content-Type': 'text/plain'})
          res.end(`Authorization failed: ${error}\nYou can close this tab.`)
          server.close()
          reject(new Error(`Reddit authorization failed: ${error}`))
          return
        }

        if (!code) {
          res.writeHead(400, {'Content-Type': 'text/html'})
          res.end('<h1>No code received</h1><p>You can close this tab.</p>')
          server.close()
          reject(new Error('No authorization code received'))
          return
        }

        const tokens = await reddit.validateAuthorizationCode(code)
        const accessToken = tokens.accessToken()

        res.writeHead(200, {'Content-Type': 'text/html'})
        res.end(
          '<h1>✓ Authorized!</h1><p>You can close this tab. Codegen will continue in the terminal.</p>'
        )

        server.close()
        resolve(accessToken)
      } catch (err) {
        res.writeHead(500, {'Content-Type': 'text/html'})
        res.end(
          '<h1>Token exchange failed</h1><p>Check the terminal for details.</p>'
        )
        server.close()
        reject(err)
      }
    })

    server.listen(port, () => {
      console.log(`⏳ Waiting for login on http://localhost:${port}...\n`)
    })

    // Timeout after 5 minutes
    setTimeout(
      () => {
        server.close()
        reject(new Error('Login timed out after 5 minutes'))
      },
      5 * 60 * 1000
    )
  })
}

function toOAuthUrl(wwwUrl: string): string {
  const url = new URL(wwwUrl.replace('https://www.reddit.com', OAUTH_BASE_URL))
  url.searchParams.set('raw_json', '1')
  return url.toString()
}

const redditEndpoints: EndpointConfig[] = [
  {
    path: '/r/{subreddit}/{sort}.json',
    method: 'GET',
    operationId: 'getSubredditPosts',
    summary: 'Get posts from a subreddit',
    tags: ['posts'],
    parameters: [
      {name: 'subreddit', in: 'path', required: true, schema: {type: 'string'}},
      {
        name: 'sort',
        in: 'path',
        required: true,
        schema: {type: 'string', enum: ['hot', 'new', 'top', 'rising']}
      },
      {name: 'limit', in: 'query', schema: {type: 'integer'}},
      {name: 'after', in: 'query', schema: {type: 'string'}},
      {
        name: 't',
        in: 'query',
        schema: {
          type: 'string',
          enum: ['hour', 'day', 'week', 'month', 'year', 'all']
        }
      }
    ],
    sampleUrls: [
      'https://www.reddit.com/r/askReddit/hot.json?limit=5',
      'https://www.reddit.com/r/programming/new.json?limit=5',
      'https://www.reddit.com/r/technology/top.json?limit=5&t=week'
    ]
  },
  {
    path: '/r/{subreddit}/about.json',
    method: 'GET',
    operationId: 'getSubredditAbout',
    summary: 'Get subreddit information',
    tags: ['subreddits'],
    parameters: [
      {name: 'subreddit', in: 'path', required: true, schema: {type: 'string'}}
    ],
    sampleUrls: [
      'https://www.reddit.com/r/askReddit/about.json',
      'https://www.reddit.com/r/programming/about.json'
    ]
  },
  {
    path: '/subreddits/search.json',
    method: 'GET',
    operationId: 'searchSubreddits',
    summary: 'Search for subreddits',
    tags: ['subreddits'],
    parameters: [
      {name: 'q', in: 'query', required: true, schema: {type: 'string'}},
      {name: 'limit', in: 'query', schema: {type: 'integer'}},
      {
        name: 'sort',
        in: 'query',
        schema: {type: 'string', enum: ['relevance', 'activity']}
      }
    ],
    sampleUrls: [
      'https://www.reddit.com/subreddits/search.json?q=javascript&limit=10',
      'https://www.reddit.com/subreddits/search.json?q=science&limit=5'
    ]
  },
  {
    path: '/subreddits/popular.json',
    method: 'GET',
    operationId: 'getPopularSubreddits',
    summary: 'Get popular subreddits',
    tags: ['subreddits'],
    parameters: [{name: 'limit', in: 'query', schema: {type: 'integer'}}],
    sampleUrls: ['https://www.reddit.com/subreddits/popular.json?limit=10']
  },
  {
    path: '/r/{subreddit}/comments/{postId}.json',
    method: 'GET',
    operationId: 'getPostComments',
    summary: 'Get comments for a post',
    tags: ['comments'],
    parameters: [
      {name: 'subreddit', in: 'path', required: true, schema: {type: 'string'}},
      {name: 'postId', in: 'path', required: true, schema: {type: 'string'}},
      {
        name: 'sort',
        in: 'query',
        schema: {
          type: 'string',
          enum: [
            'confidence',
            'top',
            'new',
            'controversial',
            'old',
            'random',
            'qa'
          ]
        }
      },
      {name: 'limit', in: 'query', schema: {type: 'integer'}}
    ],
    sampleUrls: []
  },
  {
    path: '/user/{username}/about.json',
    method: 'GET',
    operationId: 'getUserProfile',
    summary: 'Get user profile information',
    tags: ['users'],
    parameters: [
      {name: 'username', in: 'path', required: true, schema: {type: 'string'}}
    ],
    sampleUrls: [
      'https://www.reddit.com/user/spez/about.json',
      'https://www.reddit.com/user/AutoModerator/about.json'
    ]
  }
]

interface JSONSchema {
  type?: string | string[]
  properties?: Record<string, JSONSchema>
  items?: JSONSchema | {oneOf: JSONSchema[]}
  oneOf?: JSONSchema[]
  additionalProperties?: boolean
}

class OpenAPIGenerator {
  private schemas: Record<string, JSONSchema> = {}
  private responses: Record<string, unknown> = {}

  async fetchSampleData(accessToken: string): Promise<void> {
    console.log('🔍 Fetching sample data from Reddit API...\n')

    for (const endpoint of redditEndpoints) {
      console.log(`Fetching samples for ${endpoint.operationId}...`)

      let sampleUrls = endpoint.sampleUrls

      // For getPostComments, dynamically fetch real post URLs
      if (
        endpoint.operationId === 'getPostComments' &&
        sampleUrls.length === 0
      ) {
        sampleUrls = await this.fetchPostUrls(accessToken)
      }

      for (const url of sampleUrls) {
        try {
          const requestUrl = toOAuthUrl(url)
          const response = await fetch(requestUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'User-Agent': 'OpenAPI-Generator/1.0.0'
            }
          })

          if (!response.ok) {
            const errorBody = await response.text()
            console.warn(
              `⚠️  Failed to fetch ${requestUrl}: ${response.status} ${response.statusText}`
            )
            if (response.status === 403) {
              console.warn(`    Response: ${errorBody.slice(0, 200)}`)
            }
            continue
          }

          const data = await response.json()

          // Store response for schema generation
          if (!this.responses[endpoint.operationId]) {
            this.responses[endpoint.operationId] = []
          }
          ;(this.responses[endpoint.operationId] as unknown[]).push(data)

          console.log(`✓ Fetched sample from ${requestUrl}`)

          // Rate limit to respect Reddit API
          // Math.random() is safe here - only used for delay jitter, not security
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 + Math.random() * 500)
          )
        } catch (error) {
          console.error(`❌ Error fetching ${url}:`, error)
        }
      }
    }

    console.log('\n✅ Sample data collection complete\n')
  }

  private async fetchPostUrls(accessToken: string): Promise<string[]> {
    const urls: string[] = []
    const subreddits = ['AskReddit', 'programming', 'technology']

    for (const subreddit of subreddits) {
      try {
        const apiUrl = `https://oauth.reddit.com/r/${subreddit}/hot.json?limit=2`
        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'OpenAPI-Generator/1.0.0'
          }
        })

        if (response.ok) {
          const data = await response.json()
          const posts = data?.data?.children || []

          for (const post of posts.slice(0, 1)) {
            const postId = post?.data?.id
            if (postId) {
              urls.push(
                `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=10`
              )
            }
          }
        }

        // Rate limit
        // Math.random() is safe here - only used for delay jitter, not security
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 + Math.random() * 500)
        )
      } catch (error) {
        console.error(`Error fetching posts from r/${subreddit}:`, error)
      }
    }

    return urls
  }

  private inferArraySchema(value: unknown[], depth: number): JSONSchema {
    if (value.length === 0) {
      return {type: 'array', items: {}}
    }

    const itemSchemas = this.collectUniqueItemSchemas(value, depth)

    if (itemSchemas.length === 1) {
      return {type: 'array', items: itemSchemas[0]}
    }
    return {type: 'array', items: {oneOf: itemSchemas}}
  }

  private collectUniqueItemSchemas(
    value: unknown[],
    depth: number
  ): JSONSchema[] {
    const itemSchemas: JSONSchema[] = []
    const seenTypes = new Set<string>()

    for (const item of value.slice(0, 5)) {
      const itemSchema = this.inferSchemaFromValue(item, depth + 1)
      const typeKey = JSON.stringify(itemSchema)
      if (!seenTypes.has(typeKey)) {
        seenTypes.add(typeKey)
        itemSchemas.push(itemSchema)
      }
    }

    return itemSchemas
  }

  private inferObjectSchema(value: object, depth: number): JSONSchema {
    const properties: Record<string, JSONSchema> = {}

    for (const [key, val] of Object.entries(value)) {
      properties[key] = this.inferSchemaFromValue(val, depth + 1)
    }

    return {type: 'object', properties}
  }

  private inferSchemaFromValue(value: unknown, depth = 0): JSONSchema {
    if (depth > 10) {
      return {type: 'object', additionalProperties: true}
    }

    if (value === null) {
      return {type: ['string', 'null']}
    }

    if (Array.isArray(value)) {
      return this.inferArraySchema(value, depth)
    }

    if (typeof value === 'object') {
      return this.inferObjectSchema(value, depth)
    }

    return {type: typeof value}
  }

  private generateSchemaName(operationId: string, suffix = 'Response'): string {
    const name = operationId.charAt(0).toUpperCase() + operationId.slice(1)
    return `${name}${suffix}`
  }

  generateSchemas(): void {
    console.log('🔧 Generating schemas from responses...\n')

    for (const [operationId, responses] of Object.entries(this.responses)) {
      const schemaName = this.generateSchemaName(operationId)

      // Merge all response samples to get comprehensive schema
      const mergedSchema: JSONSchema = {type: 'object', properties: {}}

      for (const response of responses as unknown[]) {
        const schema = this.inferSchemaFromValue(response)
        if (schema.properties) {
          mergedSchema.properties = {
            ...mergedSchema.properties,
            ...schema.properties
          }
        }
      }

      this.schemas[schemaName] = mergedSchema
      console.log(`✓ Generated schema: ${schemaName}`)
    }

    console.log('\n✅ Schema generation complete\n')
  }

  generateOpenAPISpec(): object {
    const spec = {
      openapi: '3.1.1',
      info: {
        title: 'Reddit API',
        description: 'Generated from Reddit JSON endpoints',
        version: '1.0.0',
        license: {
          name: 'Reddit API Terms',
          url: 'https://www.redditinc.com/policies/data-api-terms'
        }
      },
      servers: [
        {
          url: OAUTH_BASE_URL,
          description: 'Reddit API server'
        }
      ],
      tags: [
        {name: 'posts', description: 'Operations related to posts'},
        {name: 'subreddits', description: 'Operations related to subreddits'},
        {name: 'comments', description: 'Operations related to comments'},
        {name: 'users', description: 'Operations related to users'}
      ],
      security: [{bearer: []}],
      components: {
        securitySchemes: {
          bearer: {
            type: 'http',
            scheme: 'bearer',
            description: 'OAuth2 Bearer token for authenticated requests'
          }
        },
        schemas: this.schemas
      },
      paths: {} as Record<string, unknown>
    }

    // Generate paths
    for (const endpoint of redditEndpoints) {
      const schemaName = this.generateSchemaName(endpoint.operationId)

      const schemaRef = this.schemas[schemaName]
        ? {$ref: `#/components/schemas/${schemaName}`}
        : {type: 'object', additionalProperties: true}

      spec.paths[endpoint.path] = {
        [endpoint.method.toLowerCase()]: {
          operationId: endpoint.operationId,
          summary: endpoint.summary,
          tags: endpoint.tags,
          parameters: endpoint.parameters || [],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: schemaRef
                }
              }
            },
            '404': {
              description: 'Not found'
            },
            '500': {
              description: 'Server error'
            }
          }
        }
      }
    }

    return spec
  }

  async saveOpenAPISpec(outputPath: string): Promise<void> {
    const spec = this.generateOpenAPISpec()

    // Ensure directory exists
    const dir = path.dirname(outputPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {recursive: true})
    }

    fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2))
    console.log(`📄 OpenAPI spec saved to: ${outputPath}`)
  }

  async generateTypes(specPath: string, outputPath: string): Promise<void> {
    try {
      console.log('\n🔧 Generating TypeScript types...')

      execSync(
        `npx openapi-typescript "${specPath}" --output "${outputPath}"`,
        {
          stdio: 'inherit'
        }
      )

      console.log(`✅ Types generated: ${outputPath}`)
    } catch (error) {
      console.error('❌ Failed to generate types:', error)
      throw error
    }
  }
}

// Export for use as module
export {OpenAPIGenerator, redditEndpoints}

// Run if called directly
if (require.main === module) {
  void (async () => {
    const generator = new OpenAPIGenerator()

    try {
      // Authenticate with Reddit (opens browser for OAuth login)
      console.log('🔑 Authenticating with Reddit...\n')
      const accessToken = await getAccessToken()
      console.log('✓ Access token obtained\n')

      // Fetch sample data
      await generator.fetchSampleData(accessToken)

      // Generate schemas from responses
      generator.generateSchemas()

      // Save OpenAPI spec
      const specPath = path.join(process.cwd(), 'scripts/reddit-openapi.json')
      await generator.saveOpenAPISpec(specPath)

      // Generate TypeScript types
      const typesPath = path.join(process.cwd(), 'lib/types/reddit-api.ts')
      await generator.generateTypes(specPath, typesPath)

      console.log('\n🎉 OpenAPI generation complete!')
      console.log('\nGenerated files:')
      console.log(`  - ${specPath}`)
      console.log(`  - ${typesPath}`)
    } catch (error) {
      console.error('❌ Generation failed:', error)
      process.exit(1)
    }
  })()
}
