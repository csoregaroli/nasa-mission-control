const http = require('http')
const path = require('path')
const dotenv = require('dotenv')
const mongoose = require('mongoose')

const dotenvPath = path.join(__dirname, '..', '.env')
dotenv.config({ path: dotenvPath })

const app = require('./app')

const { loadPlanetsData } = require('./models/planets.model')

const PORT = process.env.PORT || 8000
const MONGO_URL = process.env.MONGO_CONNECTION_STRING

const server = http.createServer(app)

mongoose.connection.once('open', () => {
  console.log('MongoDB connection ready!')
})

mongoose.connection.on('error', (err) => {
  console.error(err)
})

mongoose.set('strictQuery', false)

async function startServer() {
  mongoose.connect(MONGO_URL)
  await loadPlanetsData()

  server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`)
  })
}

startServer()
