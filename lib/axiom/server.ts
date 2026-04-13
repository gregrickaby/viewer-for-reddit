import {AxiomJSTransport, Logger} from '@axiomhq/logging'
import {createAxiomRouteHandler, nextJsFormatters} from '@axiomhq/nextjs'
import axiomClient from './axiom'

export const logger = new Logger({
  transports: [
    new AxiomJSTransport({
      axiom: axiomClient,
      dataset: process.env.AXIOM_DATASET!
    })
  ],
  formatters: nextJsFormatters
})

export const withAxiom = createAxiomRouteHandler(logger)
