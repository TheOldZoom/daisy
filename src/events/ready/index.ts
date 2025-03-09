import chalk from 'chalk';
import Client from '../../struct/Client';
import prisma from '../../struct/prisma';

export default async (client: Client) => {
  console.log(chalk.blue('-'.repeat(75)));
  client.logs.log(
    `Logged in as ${chalk.blue(client.user?.username ?? 'Unknown')}`,
  );
  const users = await prisma.user.findMany();
  client.logs.debug(`Loaded ${users.length} users from the database.`);
  users.forEach((u) => {
    if (!u.selfprefix) return;
    if (u.blacklistedSince) return;
    client.logs.debug(`Loaded self prefix "${u.selfprefix}" for user ${u.id}`);
    client.selfPrefixes.set(u.id, u.selfprefix);
  });
};
