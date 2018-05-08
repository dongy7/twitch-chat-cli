const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const chalk = require('chalk')
const program = require('commander')
const prompt = require('prompt')
const config = require('./config')
const connect = require('./client')

const homeDir = os.homedir()
const configDir = path.join(homeDir, config.dirName)
const configFile = path.join(configDir, config.configFile)

program
  .version('1.0.0')

program
  .command('add <username> <token>')
  .action((username, token, cmd) => {
    fs.ensureDirSync(configDir)
    const login = {
      username,
      token,
    }

    fs.writeFileSync(configFile, JSON.stringify(login))
  })

program
  .command('connect <channel>')
  .action((channel, cmd) => {
    if (!fs.existsSync(configDir) || !fs.existsSync(configFile)) {
      console.log(`No login credentials found. First add your oAuth token generated from ${chalk.underline('https://twitchapps.com/tmi/')}`)
      return
    }

    const credentials = JSON.parse(fs.readFileSync(configFile))
    connect(credentials, channel)
  })

program.parse(process.argv)