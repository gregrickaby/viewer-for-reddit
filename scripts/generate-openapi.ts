import {execSync} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

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

  async fetchSampleData(): Promise<void> {
    console.log('🔍 Fetching sample data from Reddit API...\n')

    for (const endpoint of redditEndpoints) {
      console.log(`Fetching samples for ${endpoint.operationId}...`)

      let sampleUrls = endpoint.sampleUrls

      // For getPostComments, dynamically fetch real post URLs
      if (
        endpoint.operationId === 'getPostComments' &&
        sampleUrls.length === 0
      ) {
        sampleUrls = await this.fetchPostUrls()
      }

      for (const url of sampleUrls) {
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'OpenAPI-Generator/1.0.0'
            }
          })

          if (!response.ok) {
            console.warn(`⚠️  Failed to fetch ${url}: ${response.status}`)
            continue
          }

          const data = await response.json()

          // Store response for schema generation
          if (!this.responses[endpoint.operationId]) {
            this.responses[endpoint.operationId] = []
          }
          ;(this.responses[endpoint.operationId] as unknown[]).push(data)

          console.log(`✓ Fetched sample from ${url}`)

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

  private async fetchPostUrls(): Promise<string[]> {
    const urls: string[] = []
    const subreddits = ['AskReddit', 'programming', 'technology']

    for (const subreddit of subreddits) {
      try {
        const response = await fetch(
          `https://www.reddit.com/r/${subreddit}/hot.json?limit=2`,
          {
            headers: {
              'User-Agent': 'OpenAPI-Generator/1.0.0'
            }
          }
        )

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

  private inferSchemaFromValue(value: unknown, depth = 0): JSONSchema {
    // Prevent infinite recursion
    if (depth > 10) {
      return {type: 'object', additionalProperties: true}
    }

    if (value === null) {
      return {type: ['string', 'null']}
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return {type: 'array', items: {}}
      }

      // Collect all unique schemas from array items
      const itemSchemas: JSONSchema[] = []
      const seenTypes = new Set<string>()

      for (const item of value.slice(0, 5)) {
        // Sample first 5 items
        const itemSchema = this.inferSchemaFromValue(item, depth + 1)
        const typeKey = JSON.stringify(itemSchema)
        if (!seenTypes.has(typeKey)) {
          seenTypes.add(typeKey)
          itemSchemas.push(itemSchema)
        }
      }

      if (itemSchemas.length === 1) {
        return {type: 'array', items: itemSchemas[0]}
      } else {
        return {type: 'array', items: {oneOf: itemSchemas}}
      }
    }

    if (typeof value === 'object') {
      const properties: Record<string, JSONSchema> = {}

      for (const [key, val] of Object.entries(value)) {
        properties[key] = this.inferSchemaFromValue(val, depth + 1)
      }

      return {type: 'object', properties}
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
          url: 'https://www.reddit.com',
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
                  schema: {
                    $ref: `#/components/schemas/${schemaName}`
                  }
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

// Run if called directly (top-level await)
if (require.main === module) {
  const generator = new OpenAPIGenerator()

  try {
    // Fetch sample data
    await generator.fetchSampleData()

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
}
