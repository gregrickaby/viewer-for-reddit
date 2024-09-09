'use client'

import {logError} from '@/lib/functions'
import {useEffect} from 'react'

export interface NewRelicProps {
  appId: string
  licenseKey: string
}

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
async function initNewRelic({appId, licenseKey}: Readonly<NewRelicProps>) {
  try {
    // Dynamically import the New Relic Browser Agent.
    const {BrowserAgent} = await import(
      '@newrelic/browser-agent/loaders/browser-agent'
    )

    // Init the agent.
    new BrowserAgent({
      init: {
        ajax: {deny_list: ['bam.nr-data.net']},
        distributed_tracing: {enabled: true},
        privacy: {cookies_enabled: true}
      },
      loader_config: {
        accountID: '4664841',
        agentID: appId,
        applicationID: appId,
        licenseKey: licenseKey,
        trustKey: '4664841'
      },
      info: {
        applicationID: appId,
        beacon: 'bam.nr-data.net',
        errorBeacon: 'bam.nr-data.net',
        licenseKey: licenseKey,
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
export default function NewRelic({appId, licenseKey}: Readonly<NewRelicProps>) {
  useEffect(() => {
    // If we're missing the required props, or this is not the browser, bail.
    if (!appId || !licenseKey || typeof window === 'undefined') return

    // Initialize the New Relic Browser Agent.
    initNewRelic({
      appId,
      licenseKey
    })
  }, [appId, licenseKey])

  return null
}
