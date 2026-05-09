import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'

const __dir = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dir, '../../../data')
mkdirSync(dataDir, { recursive: true })

const adapter = new JSONFile(join(dataDir, 'erp.json'))
const db = new Low(adapter, { materials: [], transactions: [], _nextMatId: 1, _nextTxId: 1 })

await db.read()
db.data ||= { materials: [], transactions: [], _nextMatId: 1, _nextTxId: 1 }

export default db
