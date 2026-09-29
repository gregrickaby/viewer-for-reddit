/* CLI: the last step of `npm run types:generate`. Logic lives in ./generated.ts. */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { REQUIRED_SCHEMAS, stampGenerated } from './generated'

const FILE = path.join(process.cwd(), 'lib', 'reddit', 'schemas', 'generated.ts')

readFile(FILE, 'utf8')
  .then((source) => writeFile(FILE, stampGenerated(source)))
  .then(() => console.log(`generated.ts OK (${REQUIRED_SCHEMAS.length} schemas)`))
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
