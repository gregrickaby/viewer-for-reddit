import {render, screen} from '@/test-utils'
import {Analytics} from './Analytics'

// Mock Next.js Script component
vi.mock('next/script', () => {
  return {
    default: function MockScript(props: any) {
      return <script data-testid="umami-script" {...props} />
    }
  }
})

describe('Analytics', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('should render analytics script in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('ENABLE_ANALYTICS', 'true')
    vi.stubEnv('ANALYTICS_SCRIPT_URL', 'https://test-analytics.com/script.js')
    vi.stubEnv('ANALYTICS_ID', 'test-analytics-id')

    render(<Analytics />)
    expect(screen.getByTestId('umami-script')).toBeInTheDocument()
  })

  it('should not render analytics script in development', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('ENABLE_ANALYTICS', '')

    render(<Analytics />)
    expect(screen.queryByTestId('umami-script')).not.toBeInTheDocument()
  })

  it('should not render analytics script when ENABLE_ANALYTICS is "false"', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('ENABLE_ANALYTICS', 'false')

    render(<Analytics />)
    expect(screen.queryByTestId('umami-script')).not.toBeInTheDocument()
  })

  it('should render analytics script when ENABLE_ANALYTICS is "true"', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('ENABLE_ANALYTICS', 'true')
    vi.stubEnv('ANALYTICS_SCRIPT_URL', 'https://test-analytics.com/script.js')
    vi.stubEnv('ANALYTICS_ID', 'test-analytics-id')

    render(<Analytics />)
    expect(screen.getByTestId('umami-script')).toBeInTheDocument()
  })
})
