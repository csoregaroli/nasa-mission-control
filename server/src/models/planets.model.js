const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse')

const planets = require('./planets.mongo')

function isHabitablePlanet(planet) {
  return (
    planet['koi_disposition'] === 'CONFIRMED' &&
    planet['koi_insol'] > 0.36 &&
    planet['koi_insol'] < 1.11 &&
    planet['koi_prad'] < 1.6
  )
}

function loadPlanetsData() {
  return new Promise((resolve, reject) => {
    fs.createReadStream(
      path.join(__dirname, '..', '..', 'data', 'kepler_data.csv')
    )
      .pipe(
        parse({
          comment: '#',
          columns: true,
        })
      )
      .on('data', async (data) => {
        if (isHabitablePlanet(data)) {
          const keplerName = data.kepler_name
          savePlanet(keplerName)
        }
      })
      .on('error', (err) => {
        reject(err)
      })
      .on('end', async () => {
        const countPlanetsFound = (await getAllPlanets()).length
        console.log(`${countPlanetsFound} habitable planets found!`)
        resolve()
      })
  })
}

async function getAllPlanets() {
  //first argument is for filtering, second argument is for excluding fields
  return await planets.find(
    {},
    {
      _id: 0,
      __v: 0,
    }
  )
}

async function savePlanet(keplerName) {
  // upsert = insert + update
  try {
    await planets.updateOne({ keplerName }, { keplerName }, { upsert: true })
  } catch (err) {
    console.error(`Could not save planet: ${err}`)
  }
}

module.exports = {
  loadPlanetsData,
  getAllPlanets,
}
