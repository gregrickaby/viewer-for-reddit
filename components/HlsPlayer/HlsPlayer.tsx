'use client'

import {useHlsVideo} from '@/lib/hooks/useHlsVideo'
import type {HlsPlayerProps} from '@/lib/types'
import {Center, Loader} from '@mantine/core'

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
  preload = 'none'
}: Readonly<HlsPlayerProps>) {
  const {videoRef, isLoading, isMuted} = useHlsVideo({
    src,
    fallbackUrl,
    autoPlay
  })

  return (
    <>
      {isLoading && (
        <Center>
          <Loader color="gray" />
        </Center>
      )}

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        data-testid="video"
        autoPlay={autoPlay}
        controls={controls}
        data-hint={dataHint}
        id={id}
        loop={loop}
        muted={isMuted}
        playsInline={playsInline}
        poster={poster}
        preload={preload}
        ref={videoRef}
      />
    </>
  )
}
