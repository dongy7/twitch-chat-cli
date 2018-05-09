const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const chalk = require('chalk')
const program = require('commander')
const prompt = require('prompt')
const ora = require('ora')
const fetch = require('node-fetch')
const request = require('request-promise')
const Promise = require('bluebird')
const writeFile = Promise.promisify(fs.writeFile)
const termImg = require('term-img')

const config = require('./config')
const connect = require('./client')

const HOME_DIR = os.homedir()
const CONFIG_DIR = path.join(HOME_DIR, config.dirName)
const CONFIG_FILE = path.join(CONFIG_DIR, config.configFile)
const EMOTICON_DIR = path.join(CONFIG_DIR, config.emoticonDir)
const IMAGES_DIR = path.join(EMOTICON_DIR, config.imagesDir)
const API_BASE_URL = config.apiBaseURL
const EMOTE_API_URL = `${API_BASE_URL}/channels`
const GLOBAL_CHANNEL = config.globalChannel

const getEmotes = async (channel) => {
  const url = `${EMOTE_API_URL}/${channel}`
  const res = await fetch(url)
  const json = await res.json()
  return json
}

const fetchEmotes = async (channel, emotes) => {
  const spinner = ora(`Fetching emotes for ${channel}`)
  spinner.start()
  emotes.forEach(async emote => {
    const { id, code } = emote
    const dest = path.join(IMAGES_DIR, `${id}.png`)
    const data = await request({
      url: `https://static-cdn.jtvnw.net/emoticons/v1/${id}/1.0`,
      encoding: null
    })
    const buf = Buffer.from(data, 'utf8')
    await writeFile(dest, buf)
  })
  spinner.succeed()
}

const createEmoteMap = (emoteList) => {
  const map = {}
  emoteList.forEach(emotes => {
    emotes.forEach(emote => {
      const { id, code } = emote;
      const img = termImg.string(path.join(IMAGES_DIR, `${id}.png`))
      map[code] = img
    })
  })

  return map
}

const handleConnect = async (channel) => {
  if (!fs.existsSync(CONFIG_DIR) || !fs.existsSync(CONFIG_FILE)) {
    console.log(`No login credentials found. First add your oAuth token generated from ${chalk.underline('https://twitchapps.com/tmi/')}`)
    return
  }

  fs.ensureDirSync(EMOTICON_DIR)
  fs.ensureDirSync(IMAGES_DIR)

  let spinner = ora(`Checking for emoticon api`)
  spinner.start()
  const failMsg = 'No emoticon api found. Emotes will be displayed as text.'
  let api = false

  try {
    const res = await fetch(API_BASE_URL)
    const json = await res.json()
    if (json.status) {
      spinner.succeed()
      api = true
    } else {
      spinner.fail(failMsg)
    }
  } catch(e) {
    spinner.fail(failMsg)
  }

  spinner = ora('Downloading channel emotes.')
  spinner.start()

  const globalEmotes = await getEmotes(GLOBAL_CHANNEL)
  const channelEmotes = await getEmotes(channel)

  spinner.succeed()

  fetchEmotes(GLOBAL_CHANNEL, globalEmotes)
  fetchEmotes(channel, channelEmotes)

  const emotes = createEmoteMap([globalEmotes, channelEmotes])
  const credentials = JSON.parse(fs.readFileSync(CONFIG_FILE))
  connect(credentials, channel, emotes)
}

program
  .version('1.0.0')

program
  .command('add <username> <token>')
  .action((username, token, cmd) => {
    fs.ensureDirSync(CONFIG_DIR)
    const login = {
      username,
      token,
    }

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(login))
  })

program
  .command('connect <channel>')
  .action((channel, cmd) => {
    handleConnect(channel)
  })

program.parse(process.argv)