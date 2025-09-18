'use client'

import {useHlsVideo} from '@/lib/hooks/useHlsVideo'
import type {HlsPlayerProps} from '@/lib/types'
import {Loader} from '@mantine/core'
import React, {useEffect, useState} from 'react'
import classes from './HlsPlayer.module.css'

/**
 * HlsPlayer component for rendering Reddit and external HLS/gifv video with custom controls.
 *
 * Integrates with Media Chrome web components for a modern, accessible video UI.
 * Handles lazy loading of Media Chrome, fallback to native controls, and Redux mute state.
 *
 * Features:
 * - Loads Media Chrome controls dynamically (SSR-safe)
 * - Fallbacks to native controls if Media Chrome fails
 * - Supports autoplay, loop, poster, preload, and mute
 * - Uses custom hook useHlsVideo for HLS.js and fallback logic
 * - Shows Mantine Loader while video is loading
 * - Fully accessible and keyboard-friendly
 *
 * @param props - HlsPlayerProps (see @/lib/types)
 * @returns JSX.Element for a video player with custom or native controls
 */
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
    <div className={classes.container}>
      {/* Always render media-controller, but show fallback controls if Media Chrome failed */}
      {React.createElement(
        'media-controller',
        {
          className: classes.controller,
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

      {/* Loading spinner overlay */}
      {isLoading && (
        <div className={classes.loadingOverlay}>
          <Loader color="gray" />
        </div>
      )}
    </div>
  )
}
