'use client'

import { datadogRum, RumInitConfiguration } from '@datadog/browser-rum'
import { useEffect, useRef } from 'react'

interface DatadogRumProps {
  config: RumInitConfiguration
}

/**
 * Datadog RUM component.
 */
export function DatadogRum({ config }: DatadogRumProps) {
  // Ref to track if the component has been initialized.
  const initialized = useRef(false)

  useEffect(() => {
    // If the component has already been initialized, do nothing.
    if (initialized.current) return
    initialized.current = true

    // Initialize Datadog RUM.
    datadogRum.init({
      applicationId: config.applicationId,
      clientToken: config.clientToken,
      site: 'us5.datadoghq.com',
      service: 'viewer-for-reddit',
      env: config.env,
      sessionSampleRate: 100,
      sessionReplaySampleRate: 20,
      defaultPrivacyLevel: 'allow'
    })

    // Stop session replay recording on beforeunload.
    const handleBeforeUnload = (): void => {
      datadogRum.stopSessionReplayRecording()
    }

    // Add event listener for beforeunload.
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Return cleanup function.
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [config])

  return null
}
