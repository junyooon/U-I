import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRouter from './routes/auth'
import categoriesRouter from './routes/categories'
import contactsRouter from './routes/contacts'
import interactionsRouter from './routes/interactions'
import graphRouter from './routes/graph'
import integrationsRouter from './routes/integrations'
import notificationsRouter from './routes/notifications'
import timelineRouter from './routes/timeline'
import shareRouter from './routes/share'

const app = express()
const port = process.env.PORT ?? 3001

app.use(cors({
  origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/categories', categoriesRouter)
app.use('/api/v1/contacts', contactsRouter)
app.use('/api/v1/contacts/:id/interactions', interactionsRouter)
app.use('/api/v1/graph', graphRouter)
app.use('/api/v1/integrations', integrationsRouter)
app.use('/api/v1/settings/notifications', notificationsRouter)
app.use('/api/v1/timeline', timelineRouter)
app.use('/api/v1/share', shareRouter)

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
