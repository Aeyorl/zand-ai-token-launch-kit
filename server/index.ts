import dotenv from 'dotenv'
import { createApp } from './app'

dotenv.config()

const port = Number(process.env.PORT) || 3001
const app = createApp()

const server = app.listen(port, () => {
  console.log(`🚀 ZAND AI production server running at http://localhost:${port}`)
  console.log(`📡 API Health Check: http://localhost:${port}/api/health`)
})

function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down gracefully...`)
  server.close(() => {
    console.log('Server stopped.')
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
