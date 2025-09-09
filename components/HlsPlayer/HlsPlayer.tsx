'use client'

import {useHlsVideo} from '@/lib/hooks/useHlsVideo'
import type {HlsPlayerProps} from '@/lib/types'
import {Center, Loader} from '@mantine/core'
import React, {useEffect, useState} from 'react'

export function HlsPlayer({
  src,
  fallbackUrl,
  poster,
  id,
  dataHint,
  autoPlay = false,
  controls = true,
  loop = true,
  playsInline = true,
  preload = 'none',
  hotkeys = true,
  gesturesDisabled = false,
  defaultStreamType = 'on-demand',
  breakpoints = 'sm:300 md:700'
}: Readonly<HlsPlayerProps>) {
  const {videoRef, isLoading, isMuted} = useHlsVideo({
    src,
    fallbackUrl,
    autoPlay
  })

  const [isMediaChromeLoaded, setIsMediaChromeLoaded] = useState(false)

  useEffect(() => {
    const loadMediaChrome = async () => {
      if (typeof window !== 'undefined') {
        try {
          await import('media-chrome')
          setIsMediaChromeLoaded(true)
        } catch (error) {
          console.warn('Failed to load media-chrome:', error)
          setIsMediaChromeLoaded(false)
        }
      }
    }

    loadMediaChrome()
  }, [])

  return (
    <>
      {isLoading && (
        <Center>
          <Loader color="gray" />
        </Center>
      )}

      {/* Always render media-controller, but show fallback controls if Media Chrome failed */}
      {React.createElement(
        'media-controller',
        {
          'data-testid': 'media-controller',
          hotkeys: hotkeys || undefined,
          'gestures-disabled': gesturesDisabled || undefined,
          'default-stream-type': defaultStreamType,
          breakpoints
        },
        React.createElement(
          React.Fragment,
          null,
          React.createElement('video', {
            slot: 'media',
            'data-testid': 'video',
            autoPlay,
            controls: !isMediaChromeLoaded, // Show native controls as fallback.
            'data-hint': dataHint,
            id,
            loop,
            muted: isMuted,
            playsInline,
            poster,
            preload,
            ref: videoRef
          }),

          isMediaChromeLoaded &&
            controls &&
            React.createElement(
              'media-control-bar',
              {'data-testid': 'media-control-bar'},
              React.createElement(
                React.Fragment,
                null,
                React.createElement('media-play-button'),
                React.createElement('media-time-range'),
                React.createElement('media-time-display', {
                  showduration: '',
                  remaining: ''
                }),
                React.createElement('media-mute-button'),
                React.createElement('media-volume-range'),
                React.createElement('media-fullscreen-button')
              )
            )
        )
      )}
    </>
  )
}
