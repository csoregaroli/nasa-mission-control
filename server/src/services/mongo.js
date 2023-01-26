const mongoose = require('mongoose')
const path = require('path')
const dotenv = require('dotenv')

const dotenvPath = path.join(__dirname, '..', '..', '.env')
dotenv.config({ path: dotenvPath })

const MONGO_URL = process.env.MONGO_CONNECTION_STRING

mongoose.connection.once('open', () => {
  console.log('MongoDB connection ready!')
})

mongoose.connection.on('error', (err) => {
  console.error(err)
})

mongoose.set('strictQuery', false)

function mongoConnect() {
  mongoose.connect(MONGO_URL)
}

module.exports = { mongoConnect }
