import chalk from 'chalk';
import Client from '../../struct/Client';
import prisma from '../../struct/prisma';
import { guild, user } from '@prisma/client';

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
