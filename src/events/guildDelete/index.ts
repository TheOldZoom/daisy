import { Guild } from "discord.js";
import Client from "../../struct/Client";
import prisma from "../../struct/Prisma";

export default async (guild: Guild, client: Client) => {
  client.logs.info(`Bot has left a guild: ${guild.name} (${guild.id})`);

  const existingGuild = await prisma.guild.findUnique({
    where: { id: guild.id },
  });

  if (existingGuild) {
    await prisma.guild.update({
      where: { id: guild.id },
      data: {
        lastSeenAt: new Date(),
      },
    });
    client.logs.info(`Added lastSeenAt for ${guild.name} (${guild.id})`);
  } else {
    client.logs.warn(
      `Guild ${guild.id} not found in database during deletion event`
    );
  }
};
