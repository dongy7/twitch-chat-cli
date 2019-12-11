#!/usr/bin/env node
const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const chalk = require('chalk')
const program = require('commander')
const ora = require('ora')
const fetch = require('node-fetch')
const request = require('request-promise')
const Promise = require('bluebird')
const writeFile = Promise.promisify(fs.writeFile)
const termImg = require('term-img')
const rimraf = require('rimraf')

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

const getEmotes = async channel => {
  const url = `${EMOTE_API_URL}/${channel}`
  const res = await fetch(url)
  const json = await res.json()
  return json
}

const fetchEmotes = async (channel, emotes, isGlobal) => {
  const msg = isGlobal
    ? 'Fetching global emotes.'
    : `Fetching emotes for ${chalk.bold(channel)}.`
  const spinner = ora(msg)
  spinner.start()

  // make sure all images have been fetched before continuing
  try {
    await Promise.all(
      emotes.map(async emote => {
        const { id } = emote
        const dest = path.join(IMAGES_DIR, `${id}.png`)
        const url = `https://static-cdn.jtvnw.net/emoticons/v1/${id}/2.0`
        try {
          const data = await request({
            url,
            encoding: null
          })
          const buf = Buffer.from(data, 'utf8')
          await writeFile(dest, buf)
        } catch (err) {
          console.error(`error fetching ${url}`)
        }
      })
    )
  } catch (err) {
    console.error(err.msg)
    const failMsg = isGlobal
      ? 'Failed to fetch global emotes'
      : 'Failed to fetch channel emotes'
    spinner.fail(failMsg)
    return false
  }

  spinner.succeed()
  return true
}

const createEmoteMap = emoteList => {
  const map = {}
  emoteList.forEach(emotes => {
    emotes.forEach(emote => {
      const { id, code } = emote
      const img = termImg.string(path.join(IMAGES_DIR, `${id}.png`))
      map[code] = img
    })
  })

  return map
}

const handleConnect = async channel => {
  if (!fs.existsSync(CONFIG_DIR) || !fs.existsSync(CONFIG_FILE)) {
    console.log(
      `No login credentials found. First add your oAuth token generated from ${chalk.underline(
        'https://twitchapps.com/tmi/'
      )}`
    )
    return
  }

  fs.ensureDirSync(EMOTICON_DIR)
  fs.ensureDirSync(IMAGES_DIR)

  let spinner = ora(`Checking for emoticon api.`)
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
  } catch (e) {
    spinner.fail(failMsg)
  }

  let globalEmotes
  let channelEmotes

  if (api) {
    spinner = ora('Fetching channel emoticon metadata.')
    spinner.start()

    globalEmotes = await getEmotes(GLOBAL_CHANNEL)
    channelEmotes = await getEmotes(channel)

    spinner.succeed()

    await fetchEmotes(GLOBAL_CHANNEL, globalEmotes, true)
    await fetchEmotes(channel, channelEmotes, false)
  }

  const emotes = api ? createEmoteMap([globalEmotes, channelEmotes]) : {}
  const credentials = JSON.parse(fs.readFileSync(CONFIG_FILE))
  connect(credentials, channel, emotes)
}

program.version('1.2.4')

program
  .command('add <username> <token>')
  .description('Add an OAuth token')
  .action((username, token, cmd) => {
    fs.ensureDirSync(CONFIG_DIR)
    const login = {
      username,
      token
    }

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(login))
  })

program
  .command('connect <channel>')
  .description('Connect to a specified Twitch channel')
  .action((channel, cmd) => {
    handleConnect(channel)
  })

program
  .command('clear')
  .description('Clear cached emoticons')
  .action(cmd => {
    rimraf(IMAGES_DIR, () => {
      console.log('Cached emoticons cleared 🗑️.')
    })
  })

program.parse(process.argv)
