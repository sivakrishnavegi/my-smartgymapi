import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import app from './app'
import { connectDB } from './config/ds'

const startServer = async () => {
  await connectDB()

  let port = Number(process.env.PORT) || 3000

  const server = http.createServer(app)

  const tryListen = (retries = 10) => {
    server.listen(port)
      .on('listening', () => {
        console.log(`Server running on http://localhost:${port}`)
      })
      .on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          if (retries > 0) {
            console.log(`Port ${port} is busy, trying ${port + 1}...`)
            port++
            server.close()
            tryListen(retries - 1)
          } else {
            console.error('Could not find a free port after various attempts.')
            process.exit(1)
          }
        } else {
          console.error('Server error:', err)
          process.exit(1)
        }
      })
  }

  tryListen()
}

startServer()
