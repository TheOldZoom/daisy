import 'dotenv/config';
import { GatewayIntentBits } from 'discord.js';
import Client from './struct/Client';

async function startBot() {
  const token =
    process.env.NODE_ENV === 'development'
      ? process.env.DEV_TOKEN
      : process.env.TOKEN;

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessages,
    ],
  });

  try {
    await client.initialize();

    await client.login(token);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

startBot();
