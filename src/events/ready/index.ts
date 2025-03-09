import chalk from 'chalk';
import Client from '../../struct/Client';
import prisma from '../../struct/prisma';
import { guild, user } from '@prisma/client';
import { ActivityType } from 'discord.js';

export default async (client: Client) => {
  client.logs.log(
    `Logged in as ${chalk.blue(client.user?.username ?? 'Unknown')}`,
  );
  logDivider();
  const users = await prisma.user.findMany();
  client.logs.info(`Loaded ${users.length} users from the database.`);
  client.logs.debug(users);
  client.logs.info('Loading users..');
  await loadUsers(client, users);
  client.logs.info('Loaded users.');
  logDivider();
  const guilds = await prisma.guild.findMany();
  client.logs.info(`Loaded ${guilds.length} guilds from the database.`);
  client.logs.debug(guilds)
  client.logs.info('Loading guilds..');
  await loadGuilds(client, guilds);
  client.logs.info('Loaded guilds.');
  logDivider();
  presence(client)
};

async function loadUsers(client: Client, users: user[]) {
  for (const u of users) {
    if (!u.selfprefix || u.blacklistedSince) continue;
    client.logs.info(`Loaded self prefix "${u.selfprefix}" for user ${u.id}`);
    client.prefixes.set(u.id, u.selfprefix);
  }
}

async function loadGuilds(client: Client, storedGuilds: guild[]) {
  const storedGuildIDs = new Set(storedGuilds.map((g) => g.id));
  const clientGuilds = client.guilds.cache;
  for (const [id, guild] of clientGuilds) {
    if (!storedGuildIDs.has(id)) {
      client.logs.info(`Adding missing guild ${id} to the database.`);
      await prisma.guild.create({
        data: {
          id,
          name: guild.name,
          prefix: null,
          blacklistedSince: null,
        },
      });
    }
  }
  for (const g of storedGuilds) {
    if (!g.prefix || g.blacklistedSince) continue;
    client.logs.info(`Loaded guild prefix "${g.prefix}" for guild ${g.id}`);
    client.prefixes.set(g.id, g.prefix);
  }
  for (const g of storedGuilds) {
    if (!clientGuilds.has(g.id)) {
      client.logs.info(`Removing guild ${g.id} from the database (not found in client).`);
      await prisma.guild.delete({
        where: { id: g.id },
      });
    }
  }
}

function logDivider() {
  console.log(chalk.blue('-'.repeat(75)));
}

export function processStatus(status: { text: string, type: string, url?: string }, client: Client): string {
  let processedStatus = status.text;
  processedStatus = processedStatus.replace(/{guilds\.size}/g, client.guilds.cache.size.toString());
  const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0).toString();
  processedStatus = processedStatus.replace(/{users\.size}/g, totalUsers);
  processedStatus = processedStatus.replace(/{time}/g, formatUptime(client.uptime)); return processedStatus;
}

async function presence(client: Client) {
  const updateStatus = async () => {
    try {
      const statuses = await prisma.status.findMany();

      if (statuses.length === 0) {
        client.logs.warn('No statuses found in the database.');
        return;
      }

      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const processedStatus = processStatus({
        text: randomStatus.text,
        type: randomStatus.type,
        url: randomStatus.url || undefined
      }, client);


      if (randomStatus.type === 'Streaming') {
        client.user?.setActivity(processedStatus, {
          type: ActivityType.Streaming,
          url: randomStatus.url || 'https://www.twitch.tv/TheOldZoom'
        });
      } else if (randomStatus.type === 'Custom') {
        client.user?.setActivity(processedStatus, {
          type: ActivityType.Custom
        });
      } else {
        const activityType = ActivityType[randomStatus.type as keyof typeof ActivityType];
        client.user?.setActivity(processedStatus, {
          type: activityType
        });
      }

      client.logs.debug(`Status updated to: ${processedStatus} (${randomStatus.type})`);
    } catch (error) {
      console.error(chalk.red(`[STATUS] Error updating status: ${error}`));
    }
  };

  await updateStatus();
  setInterval(updateStatus, 30 * 1000);
  client.logs.info(`Status updater started.`);
}

function formatUptime(uptime: number | null): string {
  if (!uptime) return "Unknown";

  const seconds = Math.floor(uptime / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours >= 1) {
    return `${hours} hours`;
  } else if (minutes >= 1) {
    return `${minutes} minutes`;
  } else {
    return `${seconds} seconds`;
  }
}
