const tmi = require('tmi.js')
const chalk = require('chalk')
const trim = require('trim-newlines')
const ora = require('ora')

const hex2dec = hex => parseInt(hex, 16)

const hexToRgb = hex => {
  const hexRed = hex.substring(1, 3)
  const hexGreen = hex.substring(3, 5)
  const hexBlue = hex.substring(5, 7)

  return {
    red: hex2dec(hexRed),
    green: hex2dec(hexGreen),
    blue: hex2dec(hexBlue)
  }
}

const boldMentions = words => {
  return words.map(word => {
    if (word.startsWith('@')) {
      return chalk.bold(word)
    }
    return word
  })
}

const replaceEmotes = (words, emotes) => {
  return words.map(word => {
    if (word in emotes) {
      return emotes[word] + '\n'
    }
    return word
  })
}

const getStyledMessage = (message, emotes) => {
  let words = message.split(/\s+/)
  const pipeline = [boldMentions, replaceEmotes]
  pipeline.forEach(pipe => {
    words = pipe(
      words,
      emotes
    )
  })
  return trim(words.join(' '))
}

const getBadge = user => {
  const modBadge = user.mod ? '⚔️' : ''
  const subBadge = user.subscriber ? '🌟' : ''
  const turboBadge = user.turbo ? '🔋' : ''

  return `${modBadge}${subBadge}${turboBadge}`
}

const getUserDisplayName = user => {
  const badge = getBadge(user)
  let displayName = `${badge}${user.username}`
  if (user.color) {
    const rgb = hexToRgb(user.color)
    displayName = `${chalk.rgb(rgb.red, rgb.green, rgb.blue).bold(displayName)}`
  } else {
    displayName = `${chalk.bold(displayName)}`
  }

  return displayName
}

const connect = (login, channel, emotes) => {
  const options = {
    options: {
      debug: false
    },
    connection: {
      reconnect: true
    },
    identity: {
      username: login.username,
      password: login.token
    },
    channels: [`${channel}`]
  }

  const client = new tmi.Client(options)
  const spinner = ora(
    `Connecting to ${chalk.underline(`twitch.tv/${channel}`)}.`
  )
  spinner.start()

  client.on('chat', (channel, user, message, self) => {
    if (user['message-type'] !== 'chat') {
      return
    }

    const displayName = getUserDisplayName(user)
    const displayMessage = getStyledMessage(message, emotes)

    console.log(`${displayName}: ${displayMessage}`)
  })

  client.on('connected', () => {
    spinner.succeed()
  })
  client.connect()
}

module.exports = connect
