import express from 'express'
import cors from 'cors'
import materialsRouter    from './routes/materials.js'
import transactionsRouter from './routes/transactions.js'
import dashboardRouter    from './routes/dashboard.js'

const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/materials',    materialsRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/dashboard',    dashboardRouter)
app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => console.log(`✓ Backend: http://localhost:${PORT}`))
