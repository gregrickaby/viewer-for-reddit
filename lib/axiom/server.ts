import {AxiomJSTransport, ConsoleTransport, Logger} from '@axiomhq/logging'
import {createAxiomRouteHandler, nextJsFormatters} from '@axiomhq/nextjs'
import axiomClient from './axiom'

export const logger =
  process.env.NODE_ENV === 'production'
    ? new Logger({
        transports: [
          new AxiomJSTransport({
            axiom: axiomClient,
            dataset: process.env.AXIOM_DATASET!
          })
        ],
        formatters: nextJsFormatters
      })
    : new Logger({transports: [new ConsoleTransport()]})

export const withAxiom = createAxiomRouteHandler(logger)
