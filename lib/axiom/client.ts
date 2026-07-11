'use client'

import {ConsoleTransport, Logger, ProxyTransport} from '@axiomhq/logging'
import {createUseLogger, createWebVitalsComponent} from '@axiomhq/react'

export const logger =
  process.env.NODE_ENV === 'production'
    ? new Logger({
        transports: [new ProxyTransport({url: '/api/axiom', autoFlush: true})]
      })
    : new Logger({transports: [new ConsoleTransport()]})

export const useLogger = createUseLogger(logger)
export const WebVitals = createWebVitalsComponent(logger)
