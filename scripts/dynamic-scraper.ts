import fs from 'fs'
import path from 'path'
import {OpenAPIGenerator} from './generate-openapi'

interface DynamicEndpoint {
  template: string
  method: 'GET' | 'POST'
  operationId: string
  summary: string
  tags: string[]
  generator: (baseUrl: string) => Promise<string[]>
}

class DynamicRedditScraper extends OpenAPIGenerator {
  private dynamicEndpoints: DynamicEndpoint[] = [
    {
      template: '/r/{subreddit}/comments/{postId}.json',
      method: 'GET',
      operationId: 'getPostComments',
      summary: 'Get comments for a specific post',
      tags: ['comments'],
      generator: async (baseUrl) => {
        // Fetch recent posts to get real post IDs
        const subreddits = ['askReddit', 'damnthatsinteresting', 'news', 'pics']
        const urls: string[] = []

        for (const sub of subreddits) {
          try {
            const response = await fetch(
              `${baseUrl}/r/${sub}/hot.json?limit=3`,
              {
                headers: {'User-Agent': 'OpenAPI-Generator/1.0.0'}
              }
            )

            if (!response.ok) continue

            const data = await response.json()
            const posts = data?.data?.children || []

            for (const post of posts.slice(0, 2)) {
              // Just 2 per subreddit
              const postId = post?.data?.id
              if (postId) {
                urls.push(
                  `${baseUrl}/r/${sub}/comments/${postId}.json?limit=10`
                )
              }
            }

            // Rate limit
            await new Promise((resolve) => setTimeout(resolve, 1000))
          } catch (error) {
            console.warn(`Failed to fetch posts from r/${sub}:`, error)
          }
        }

        return urls
      }
    },
    {
      template: '/user/{username}/about.json',
      method: 'GET',
      operationId: 'getUserProfile',
      summary: 'Get user profile information',
      tags: ['users'],
      generator: async (baseUrl) => {
        // Get some usernames from recent posts
        const response = await fetch(
          `${baseUrl}/r/askReddit/hot.json?limit=5`,
          {
            headers: {'User-Agent': 'OpenAPI-Generator/1.0.0'}
          }
        )

        if (!response.ok) return []

        const data = await response.json()
        const posts = data?.data?.children || []
        const usernames = posts
          .map((post: any) => post?.data?.author)
          .filter((author: string) => author && author !== '[deleted]')
          .slice(0, 3) // Just a few samples

        return usernames.map(
          (username: string) => `${baseUrl}/user/${username}/about.json`
        )
      }
    }
  ]

  async fetchDynamicEndpoints(): Promise<void> {
    console.log('🔍 Discovering dynamic endpoints...\n')

    const baseUrl = 'https://www.reddit.com'

    for (const endpoint of this.dynamicEndpoints) {
      console.log(`Generating URLs for ${endpoint.operationId}...`)

      try {
        const urls = await endpoint.generator(baseUrl)
        console.log(`Found ${urls.length} dynamic URLs`)

        // Fetch samples from discovered URLs
        for (const url of urls) {
          try {
            const response = await fetch(url, {
              headers: {'User-Agent': 'OpenAPI-Generator/1.0.0'}
            })

            if (!response.ok) {
              console.warn(`⚠️  Failed to fetch ${url}: ${response.status}`)
              continue
            }

            const data = await response.json()

            // Store response
            const key = `${endpoint.operationId}_${Math.random().toString(36).substr(2, 9)}`
            this.responses[key] = data

            console.log(`✅ Fetched dynamic sample: ${url.substring(0, 80)}...`)

            // Rate limit
            await new Promise((resolve) => setTimeout(resolve, 1500))
          } catch (error) {
            console.error(`❌ Error fetching ${url}:`, error)
          }
        }
      } catch (error) {
        console.error(
          `❌ Failed to generate URLs for ${endpoint.operationId}:`,
          error
        )
      }
    }
  }

  generateEnhancedOpenAPISpec(): object {
    const spec = super.generateOpenAPISpec() as any

    // Ensure tags are included if not already present
    if (!spec.tags) {
      spec.tags = [
        {name: 'posts', description: 'Operations related to posts'},
        {name: 'subreddits', description: 'Operations related to subreddits'},
        {name: 'comments', description: 'Operations related to comments'},
        {name: 'users', description: 'Operations related to users'}
      ]
    }

    // Add dynamic endpoints to the spec
    for (const endpoint of this.dynamicEndpoints) {
      const schemaName = this.generateSchemaName(endpoint.operationId)

      // Extract parameters from template
      const parameters = this.extractParametersFromTemplate(endpoint.template)

      spec.paths[endpoint.template] = {
        [endpoint.method.toLowerCase()]: {
          operationId: endpoint.operationId,
          summary: endpoint.summary,
          tags: endpoint.tags,
          parameters,
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
            '404': {description: 'Not found'},
            '500': {description: 'Server error'}
          }
        }
      }
    }

    return spec
  }

  private extractParametersFromTemplate(template: string): any[] {
    const paramRegex = /{([^}]+)}/g
    const parameters: any[] = []
    let match

    while ((match = paramRegex.exec(template)) !== null) {
      const paramName = match[1]
      parameters.push({
        name: paramName,
        in: 'path',
        required: true,
        schema: {type: 'string'},
        description: `The ${paramName} parameter`
      })
    }

    // Add common query parameters
    if (template.includes('comments')) {
      parameters.push(
        {
          name: 'limit',
          in: 'query',
          schema: {type: 'integer', minimum: 1, maximum: 500},
          description: 'Maximum number of comments to return'
        },
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
          },
          description: 'Comment sort order'
        }
      )
    }

    return parameters
  }
}

async function generateCompleteSpec(): Promise<void> {
  const scraper = new DynamicRedditScraper()

  try {
    // Fetch static endpoint samples
    await scraper.fetchSampleData()

    // Discover and fetch dynamic endpoints
    await scraper.fetchDynamicEndpoints()

    // Generate schemas
    scraper.generateSchemas()

    // Save enhanced OpenAPI spec
    const specPath = path.join(
      process.cwd(),
      'scripts/reddit-openapi-complete.json'
    )
    const spec = scraper.generateEnhancedOpenAPISpec()

    fs.writeFileSync(specPath, JSON.stringify(spec, null, 2))
    console.log(`\n📄 Complete OpenAPI spec saved: ${specPath}`)

    // Generate TypeScript types
    const typesPath = path.join(process.cwd(), 'lib/types/reddit-api.ts')
    await scraper.generateTypes(specPath, typesPath)

    // Generate a summary
    const summary = {
      endpoints: Object.keys(spec.paths).length,
      schemas: Object.keys(spec.components.schemas).length,
      generatedAt: new Date().toISOString(),
      sampleCount: Object.keys(scraper.responses).length
    }

    fs.writeFileSync(
      path.join(process.cwd(), 'scripts/generation-summary.json'),
      JSON.stringify(summary, null, 2)
    )

    console.log('\n📊 Generation Summary:')
    console.log(`- Endpoints: ${summary.endpoints}`)
    console.log(`- Schemas: ${summary.schemas}`)
    console.log(`- Samples processed: ${summary.sampleCount}`)
    console.log(`\n🎉 Complete Reddit API spec generated!`)
  } catch (error) {
    console.error('❌ Complete generation failed:', error)
    process.exit(1)
  }
}

export {DynamicRedditScraper, generateCompleteSpec}

if (require.main === module) {
  generateCompleteSpec()
}
