'use client'

import {formatTimeAgo} from '@/lib/utils/formatters'
import {useEffect, useState} from 'react'

interface TimeAgoProps {
  /** Unix timestamp in seconds */
  timestamp: number
}

/**
 * Renders a relative "x ago" time, computed client-side only.
 *
 * Computing it during SSR and again during hydration uses two different
 * clocks (server request time vs. client hydration time), which can land on
 * opposite sides of a rounding boundary and produce a hydration mismatch
 * (React error #418). Starting from a fixed, environment-independent value
 * and filling in the real label after mount avoids that entirely.
 */
export function TimeAgo({timestamp}: Readonly<TimeAgoProps>) {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    setLabel(formatTimeAgo(timestamp))
  }, [timestamp])

  return <>{label}</>
}
