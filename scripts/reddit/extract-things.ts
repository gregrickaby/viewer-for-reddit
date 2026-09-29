/* CLI: `npm run types:extract`. Logic lives in ./things.ts. */
import path from 'node:path'
import { extractThings } from './things'

const root = process.cwd()

extractThings({
  rawDir: path.join(root, 'fixtures', 'reddit', 'raw'),
  outDir: path.join(root, 'fixtures', 'reddit', 'things'),
  schemaDir: path.join(root, 'lib', 'reddit', 'schemas'),
}).catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
