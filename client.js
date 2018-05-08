const tmi = require('tmi.js')
const chalk = require('chalk')

const hex2dec = (hex) => parseInt(hex, 16)

const hexToRgb = (hex) => {
  const hexRed = hex.substring(1,3)
  const hexGreen = hex.substring(3,5)
  const hexBlue = hex.substring(5,7)

  return {
    red: hex2dec(hexRed),
    green: hex2dec(hexGreen),
    blue: hex2dec(hexBlue)
  }
}

const connect = (login, channel) => {
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
  client.on('chat', (channel, user, message, self) => {
    if (user['message-type'] != 'chat') {
      return
    }

    const subscriberBadge = user.subscriber ? '🌟' : ''
    const turboBadge = user.turbo ? '🔋' : ''
    let displayName = `${subscriberBadge}${turboBadge}${user.username}`
    if (user.color) {
      const rgb = hexToRgb(user.color)
      displayName = `${chalk.rgb(rgb.red, rgb.green, rgb.blue).bold(displayName)}`
    } else {
      displayName = `${chalk.bold(displayName)}`
    }

    console.log(`${displayName}: ${message}`)
  })

  client.connect()
}

module.exports = connect