import 'babel-polyfill'
import 'colors'
import wd from 'wd'
import {assert} from 'chai'

const username = process.env.KOBITON_USERNAME
const apiKey = process.env.KOBITON_API_KEY

const platformVersion = process.env.KOBITON_DEVICE_PLATFORM_VERSION
const platformName = process.env.KOBITON_DEVICE_PLATFORM_NAME || 'Android'
const deviceName = process.env.KOBITON_DEVICE_NAME

if (deviceName == null) {
  if (platformName == 'Android') {
    deviceName = 'Galaxy*'
  } else if (platformName == 'iOS') {
    deviceName = 'iPhone*'
  }
}

const kobitonServerConfig = {
  protocol: 'https',
  host: 'api.kobiton.com',
  auth: `${username}:${apiKey}`
}

const desiredCaps = {
  sessionName:        'Automation test session',
  sessionDescription: 'Demo Automation Test on Android', 
  deviceOrientation:  'portrait',  
  captureScreenshots: true, 
  app:                '<APP_URL>', 
  deviceGroup:        'KOBITON', 
  deviceName:         deviceName,
  platformName:       platformName
}

// This magic line will modify 'app' value of desiredCaps to get the URL provided from the 'APP_URL' environment variable.
// Also, if you want to use another specific device for executing test, you don't have to worry about it not accepting URL from environment variable.
desiredCaps.app = process.env.APP_URL

let driver

if (platformVersion) {
  desiredCaps.platformVersion = platformVersion
}

if (!username || !apiKey || !desiredCaps.app) {
  console.log('Error: Environment variables KOBITON_USERNAME, KOBITON_API_KEY and Application URL are required to execute script')
  process.exit(1)
}

describe('Android App sample', () => {

  before(async () => {
    driver = wd.promiseChainRemote(kobitonServerConfig)

    driver.on('status', (info) => {
      console.log(info.cyan)
    })
    driver.on('command', (meth, path, data) => {
      console.log(' > ' + meth.yellow, path.grey, data || '')
    })
    driver.on('http', (meth, path, data) => {
      console.log(' > ' + meth.magenta, path, (data || '').grey)
    })

    try {
      await driver.init(desiredCaps)
    }
    catch (err) {
      if (err.data) {
        console.error(`init driver: ${err.data}`)
      }
    throw err
    }
  })

  // By default, the script only open and close the application.
  // If you want to perform specific test(s) to your application, please insert corresponding ones here.

  after(async () => {
    if (driver != null) {
    try {
      await driver.quit()
    }
    catch (err) {
      console.error(`quit driver: ${err}`)
    }
  }
  })
})