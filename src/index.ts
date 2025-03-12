process.stdout.write('\x1Bc')

import 'dotenv/config'
import { GatewayIntentBits, DefaultWebSocketManagerOptions } from 'discord.js'
import figlet from 'figlet'
import express, { NextFunction, Request, Response } from 'express'
import Client from './struct/Client'
import { analyzeCodeStats } from './utils/readFiles'
import chalk from 'chalk'

async function startBot() {
  console.log(chalk.blue(await figletPromise('DAISY')))
  const token =
    process.env.NODE_ENV === 'development'
      ? process.env.DEV_TOKEN
      : process.env.TOKEN
  const port =
    process.env.NODE_ENV === 'development' ? 3001 : process.env.PORT || 3000
  const app = express()
  const { identifyProperties } = DefaultWebSocketManagerOptions
  //@ts-ignore
  identifyProperties.browser = 'Discord Android'

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessages,
    ],
    allowedMentions: {
      parse: [],
      repliedUser: true,
    },
  })
  console.log(chalk.blue('-'.repeat(75)))
  const projectDetails = await analyzeCodeStats(process.cwd())
  client.logs.info(`Total Files: ${projectDetails.totalFiles}`)
  client.logs.info(`Total Lines: ${projectDetails.totalLines}`)
  client.logs.info(`Total Characters: ${projectDetails.totalChars}`)
  client.logs.info(`Average Lines per File: ${projectDetails.averageLines}`)
  client.logs.info(
    `Average Characters per File: ${projectDetails.averageChars}`
  )
  client.logs.info(
    `Largest file: ${projectDetails.largestFile?.path} with ${projectDetails.largestFile?.lines} lines`
  )

  console.log(chalk.blue('-'.repeat(75)))

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      !req.headers.authorization ||
      req.headers.authorization !== process.env.API_KEY
    ) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    next()
  })

  app.get('/', (req: Request, res: Response) => {
    if (!client.user) {
      return res.status(503).json({ error: 'Bot is not logged in yet.' })
    }
    const users = client.guilds.cache.reduce(
      (acc, guild) => acc + guild.memberCount,
      0
    )
    res.json({
      bot: client.user,
      uptime: client.uptime,
      guilds: client.guilds.cache.size,
      users,
      channels: client.channels.cache.size,
      commands: client.commands.size,
      events: client.events.size,
    })
  })

  app.listen(port, () => {
    client.logs.info(`Server is running on port ${port}`)
  })

  try {
    await client.initialize()
    await client.login(token)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

startBot()

function figletPromise(text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    figlet(text, (err, data) => {
      if (err) {
        reject('Something went wrong...')
      } else {
        resolve(data as string)
      }
    })
  })
}
