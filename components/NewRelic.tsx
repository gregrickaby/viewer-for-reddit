'use client'

import {logError} from '@/lib/functions'
import {useEffect} from 'react'

/**
 * Initialize the New Relic Browser Agent.
 *
 * The browser agent can only be intialized in the browser.
 * We need to dynamically import the agent in the browser,
 * then run the initialization code in a useEffect() hook:
 * https://github.com/newrelic/newrelic-browser-agent/issues/865#issuecomment-1930408911
 *
 * @see https://github.com/newrelic/newrelic-browser-agent
 */
async function initNewRelic() {
  try {
    // Dynamically import the New Relic Browser Agent.
    const {BrowserAgent} = await import(
      '@newrelic/browser-agent/loaders/browser-agent'
    )

    // Get environment variables.
    const browserAppId = process.env.NEXT_PUBLIC_NEW_RELIC_BROWSER_APP_ID
    const browserLicenseKey =
      process.env.NEXT_PUBLIC_NEW_RELIC_BROWSER_LICENSE_KEY

    // No variables? Bail.
    if (!browserAppId || !browserLicenseKey) {
      throw new Error(
        `New Relic config error: ${!browserAppId ? 'Browser App ID' : 'Browser License Key'} is missing.`
      )
    }

    // Init the agent.
    new BrowserAgent({
      init: {
        ajax: {deny_list: ['bam.nr-data.net']},
        distributed_tracing: {enabled: true},
        privacy: {cookies_enabled: true}
      },
      loader_config: {
        accountID: '4664841',
        agentID: browserAppId,
        applicationID: browserAppId,
        licenseKey: browserLicenseKey,
        trustKey: '4664841'
      },
      info: {
        applicationID: browserAppId,
        beacon: 'bam.nr-data.net',
        errorBeacon: 'bam.nr-data.net',
        licenseKey: browserLicenseKey,
        sa: 1
      }
    })
  } catch (error) {
    logError(error)
  }
}

/**
 * New Relic Browser Agent snippet.
 */
export default function NewRelic() {
  useEffect(() => {
    // Only run in the browser.
    if (typeof window === 'undefined') return

    // Initialize the New Relic Browser Agent.
    initNewRelic()
  }, [])

  return null
}
