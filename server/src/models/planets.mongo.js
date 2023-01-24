const mongoose = require('mongoose')

const planetSchema = new mongoose.Schema({
  keplerName: {
    type: String,
    required: true,
  },
})

//Connects planetSchema with "planets" model
module.exports = mongoose.model('Planet', planetSchema)
