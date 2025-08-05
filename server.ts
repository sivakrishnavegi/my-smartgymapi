import dotenv from 'dotenv'
dotenv.config()

import app from './app'
import { connectDB } from './config/ds'

const PORT = process.env.PORT || 3000

connectDB()

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
