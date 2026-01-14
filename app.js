require('dotenv').config()

const { createBot, createProvider, createFlow } = require('@bot-whatsapp/bot')
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const JsonFileAdapter = require('@bot-whatsapp/database/json')

const {
  flowWelcome,
  flowDocument,
  flowImage,
  flowAskComparison
} = require('./src/modules/flows')

const main = async () => {
  const adapterDB = new JsonFileAdapter()
  const adapterFlow = createFlow([
    flowWelcome,
    flowDocument,
    flowImage,
    flowAskComparison
  ])
  const adapterProvider = createProvider(BaileysProvider, {
    experimentalStore: true,
    timeRelease: 10800000,
  })

  await createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  })

  adapterProvider.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'open') {
      console.log('✓ WhatsApp connected - Ready')
    }
    if (connection === 'close') {
      console.log('✗ Connection closed:', lastDisconnect?.error?.message)
    }
  })

  QRPortalWeb()
  console.log('Bot initializing...')
}

main()
