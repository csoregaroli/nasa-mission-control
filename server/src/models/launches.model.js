const axios = require('axios')

const launchesDatabase = require('./launches.mongo')
const planets = require('./planets.mongo')

const DEFAULT_FLIGHT_NUMBER = 100

const launch = {
  flightNumber: 100, // flight_number
  mission: 'Kepler Exploration X', // name
  rocket: 'Explorer IS1', // rocket.name
  launchDate: new Date('December 27, 2030'), // date_local
  target: 'Kepler-442 b', // N/A
  customers: ['NASA', 'ZTM'], // payloads.customers for each payload
  upcoming: true, // upcoming
  success: true, // success
}

saveLaunch(launch)

// SpaceX API functions
const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query'

async function populateLaunches() {
  console.log('Downloading launch data...')
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        { path: 'rocket', select: { name: 1 } },
        { path: 'payloads', select: { customers: 1 } },
      ],
    },
  })

  const launchDocs = response.data.docs
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc['payloads']
    const customers = payloads.flatMap((payload) => {
      return payload['customers']
    })

    const launch = {
      flightNumber: launchDoc['flight_number'],
      mission: launchDoc['name'],
      rocket: launchDoc['rocket']['name'],
      launchDate: launchDoc['date_local'],
      upcoming: launchDoc['upcoming'],
      success: launchDoc['success'],
      customers,
    }

    console.log(`${launch.flightNumber} ${launch.mission}`)

    // Populate launches collection
  }
}

async function loadLaunchData() {
  const firstSpaceXLaunch = await findLaunch({
    flightNumber: 1,
    rocket: 'Falcon 1',
    mission: 'FalconSat',
  })
  if (firstSpaceXLaunch) {
    console.log('Launch data already loaded')
  } else {
    await populateLaunches()
  }
}

// General launch functions
async function findLaunch(filter) {
  return await launchesDatabase.findOne(filter)
}

// Check if a launch exists
async function existsLaunchWithId(launchId) {
  return await findLaunch({ flightNumber: launchId })
}

// Get flight_number of last flight added to db
async function getLatestFlightNumber() {
  //"-flightNumber" means it sorts desc
  const latestLaunch = await launchesDatabase.findOne().sort('-flightNumber')

  if (!latestLaunch) {
    return DEFAULT_FLIGHT_NUMBER
  }

  return latestLaunch.flightNumber
}

// Returns all launches in db
async function getAllLaunches() {
  return await launchesDatabase.find({}, { _id: 0, __v: 0 })
}

// Saves new launch to db
async function saveLaunch(launch) {
  const planet = await planets.findOne({
    keplerName: launch.target,
  })

  if (!planet) {
    throw new Error('No matching planet was found')
  }

  await launchesDatabase.findOneAndUpdate(
    {
      flightNumber: launch.flightNumber,
    },
    launch,
    {
      upsert: true,
    }
  )
}

// Creates a new launch
async function scheduleNewLaunch(launch) {
  const newFlightNumber = (await getLatestFlightNumber()) + 1

  const newLaunch = Object.assign(launch, {
    flightNumber: newFlightNumber,
    customers: ['ZTM', 'NASA'],
    upcoming: true,
    success: true,
  })

  await saveLaunch(newLaunch)
}

// Updates launch upcoming + success fields in db
async function abortLaunchById(launchId) {
  const aborted = await launchesDatabase.updateOne(
    {
      flightNumber: launchId,
    },
    {
      upcoming: false,
      success: false,
    }
  )

  return aborted.modifiedCount === 1
}

module.exports = {
  getAllLaunches,
  scheduleNewLaunch,
  existsLaunchWithId,
  abortLaunchById,
  loadLaunchData,
}
