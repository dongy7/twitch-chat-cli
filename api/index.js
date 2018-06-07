const express = require('express')
const pg = require('pg')

const connectionString =
  process.env.DATABASE_URL || 'postgres://localhost:5432/emotes'

const app = express()
const router = express.Router()
const port = process.env.PORT || 3000

const client = new pg.Client(connectionString)
client.connect().catch(err => console.error(err))

app.listen(port, () => {
  console.log('api server started')
})

router.route('/channels').get((req, res) => {
  res.json({ message: 'Channels' })
})

router.route('/channels/:name').get((req, res) => {
  const name = req.params.name === 'twitch' ? '' : req.params.name
  const queryText = `
    SELECT emoticons.code, emoticons.id
    FROM emoticons
    INNER JOIN channelsets ON emoticons.set = channelsets.set
    INNER JOIN channels ON channelsets.channel = channels.id
    WHERE channels.name = $1
    `
  const query = {
    text: queryText,
    values: [name]
  }

  client.query(query, (err, queryRes) => {
    if (err) {
      console.log(err.stack)
    } else {
      res.json(queryRes.rows)
    }
  })
})

router.get('/', (req, res) => {
  res.json({ status: true })
})

app.use('/api', router)
