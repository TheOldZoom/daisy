import chalk from 'chalk';
import Client from '../../struct/Client';
import prisma from '../../struct/Prisma';
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
  client.logs.debug(guilds);
  client.logs.info('Loading guilds..');
  await loadGuilds(client, guilds);
  client.logs.info('Loaded guilds.');
  logDivider();
  presence(client);
};

async function loadUsers(client: Client, users: user[]) {
  for (const u of users) {
    if (!u.selfprefix || u.blacklistedSince) continue;
    client.logs.info(`Loaded self prefix "${u.selfprefix}" for user ${u.id}`);
    client.prefixes.set(u.id, u.selfprefix);
  }
  for (const u of users) {
    if (!u.blacklistedSince) continue;
    client.logs.debug(`Loaded blacklist for user ${u.id}`);
    client.blacklists.set(u.id, u.blacklistedSince);
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
      client.logs.info(
        `Removing guild ${g.id} from the database (not found in client).`,
      );
      await prisma.guild.delete({
        where: { id: g.id },
      });
    }
  }
}

function logDivider() {
  console.log(chalk.blue('-'.repeat(75)));
}

export function processStatus(
  status: { text: string; type: string; url?: string },
  client: Client,
): string {
  let processedStatus = status.text;
  processedStatus = processedStatus.replace(
    /{guilds\.size}/g,
    client.guilds.cache.size.toString(),
  );
  const totalUsers = client.guilds.cache
    .reduce((acc, guild) => acc + guild.memberCount, 0)
    .toString();
  processedStatus = processedStatus.replace(/{users\.size}/g, totalUsers);
  processedStatus = processedStatus.replace(
    /{time}/g,
    formatUptime(client.uptime),
  );
  return processedStatus;
}


async function presence(client: Client) {
  let lastStatus: string | null = null;

  const updateStatus = async () => {
    try {
      const statuses = await prisma.status.findMany();
      if (statuses.length === 0) {
        client.logs.warn('No statuses found in the database.');
        return;
      }

      const shuffledStatuses = statuses.sort(() => 0.5 - Math.random());
      const randomStatus = shuffledStatuses[0];

      if (randomStatus.text === lastStatus) {
        return setTimeout(updateStatus, 15 * 1000);
      }

      const processedStatus = processStatus(
        {
          text: randomStatus.text,
          type: randomStatus.type,
          url: randomStatus.url || undefined,
        },
        client,
      );

      const activityOptions: { type: ActivityType, url?: string } = {
        type: getActivityType(randomStatus.type),
        url: randomStatus.url || 'https://www.twitch.tv/TheOldZoom',
      };

      client.user?.setActivity(processedStatus, activityOptions);
      client.logs.debug(
        `Status updated to: ${processedStatus} (${randomStatus.type})`,
      );

      lastStatus = randomStatus.text;

      setTimeout(updateStatus, 15 * 1000);
    } catch (error) {
      console.error(chalk.red(`[STATUS] Error updating status: ${error}`));
    }
  };

  await updateStatus();
  client.logs.info(`Status updater started.`);
}

function getActivityType(type: string): ActivityType {
  switch (type) {
    case 'Streaming':
      return ActivityType.Streaming;
    case 'Custom':
      return ActivityType.Custom;
    default:
      return ActivityType[type as keyof typeof ActivityType] || ActivityType.Playing;
  }
}



function formatUptime(uptime: number | null): string {
  if (!uptime) return 'Unknown';

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
