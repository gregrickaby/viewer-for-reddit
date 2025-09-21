import fs from 'fs'
import path from 'path'

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
      'https://www.reddit.com/r/damnthatsinteresting/new.json?limit=5',
      'https://www.reddit.com/r/news/top.json?limit=5&t=week',
      'https://www.reddit.com/r/pics/hot.json?limit=5'
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
      'https://www.reddit.com/r/damnthatsinteresting/about.json',
      'https://www.reddit.com/r/news/about.json',
      'https://www.reddit.com/r/pics/about.json'
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
      'https://www.reddit.com/subreddits/search.json?q=interesting&limit=10',
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
    sampleUrls: [
      // We'll need to fetch actual post IDs dynamically
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
  private responses: Record<string, any> = {}

  async fetchSampleData(): Promise<void> {
    console.log('🔍 Fetching sample data from Reddit API...\n')

    for (const endpoint of redditEndpoints) {
      console.log(`Fetching samples for ${endpoint.operationId}...`)

      for (const url of endpoint.sampleUrls) {
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
          const key = `${endpoint.operationId}_${Math.random().toString(36).substr(2, 9)}`
          this.responses[key] = data

          console.log(`✅ Fetched sample from ${url}`)

          // Rate limit
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (error) {
          console.error(`❌ Error fetching ${url}:`, error)
        }
      }
    }
  }

  private inferSchemaFromValue(value: any, depth = 0): JSONSchema {
    if (depth > 10) return {type: 'object'} // Prevent infinite recursion

    if (value === null) return {type: ['string', 'null']}

    if (Array.isArray(value)) {
      if (value.length === 0) return {type: 'array', items: {type: 'object'}}

      // Infer from first few items
      const samples = value.slice(0, 3)
      const itemSchemas = samples.map((item) =>
        this.inferSchemaFromValue(item, depth + 1)
      )

      // If all items have same structure, use first one
      if (itemSchemas.length === 1) {
        return {type: 'array', items: itemSchemas[0]}
      }

      return {
        type: 'array',
        items: {oneOf: itemSchemas}
      }
    }

    const type = typeof value

    switch (type) {
      case 'string':
        return {type: 'string'}
      case 'number':
        return {type: Number.isInteger(value) ? 'integer' : 'number'}
      case 'boolean':
        return {type: 'boolean'}
      case 'object': {
        const properties: Record<string, JSONSchema> = {}

        for (const [key, val] of Object.entries(value)) {
          properties[key] = this.inferSchemaFromValue(val, depth + 1)
        }

        return {
          type: 'object',
          properties
        }
      }
      default:
        return {type: 'string'}
    }
  }

  private generateSchemaName(operationId: string, suffix = 'Response'): string {
    return operationId.charAt(0).toUpperCase() + operationId.slice(1) + suffix
  }

  generateSchemas(): void {
    console.log('\n📋 Generating OpenAPI schemas...\n')

    for (const [key, response] of Object.entries(this.responses)) {
      const operationId = key.split('_')[0]
      const schemaName = this.generateSchemaName(operationId)

      const schema = this.inferSchemaFromValue(response)

      // Merge with existing schema if it exists (to handle multiple samples)
      if (this.schemas[schemaName]) {
        // Simple merge strategy - could be more sophisticated
        this.schemas[schemaName] = schema
      } else {
        this.schemas[schemaName] = schema
      }

      console.log(`✅ Generated schema: ${schemaName}`)
    }
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
      paths: {} as Record<string, any>,
      components: {
        schemas: this.schemas
      }
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
    console.log(`\n📄 OpenAPI spec saved to: ${outputPath}`)
  }

  async generateTypes(specPath: string, outputPath: string): Promise<void> {
    const {execSync} = require('child_process')

    try {
      console.log('\n🔧 Generating TypeScript types...')

      execSync(
        `npx openapi-typescript "${specPath}" --output "${outputPath}"`,
        {stdio: 'inherit'}
      )

      console.log(`✅ Types generated: ${outputPath}`)
    } catch (error) {
      console.error('❌ Failed to generate types:', error)
      throw error
    }
  }
}

async function main(): Promise<void> {
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
    console.log(`\nNext steps:`)
    console.log(`1. Review the generated spec: ${specPath}`)
    console.log(`2. Use the generated types: ${typesPath}`)
    console.log(
      `3. Add to package.json: "codegen": "tsx scripts/generate-openapi.ts"`
    )
  } catch (error) {
    console.error('❌ Generation failed:', error)
    process.exit(1)
  }
}

// Export for use as module
export {OpenAPIGenerator, redditEndpoints}

// Run if called directly
if (require.main === module) {
  main()
}
