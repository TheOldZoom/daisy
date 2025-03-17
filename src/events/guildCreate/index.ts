import { Guild } from "discord.js";
import Client from "../../struct/Client";
import prisma from "../../struct/Prisma";

export default async (guild: Guild, client: Client) => {
  client.logs.info(`Bot has joined a new guild: ${guild.name} (${guild.id})`);

  const existingGuild = await prisma.guild.findUnique({
    where: { id: guild.id },
  });

  if (!existingGuild) {
    await prisma.guild.create({
      data: {
        id: guild.id,
        name: guild.name,
        prefix: null,
        blacklistedSince: null,
        icon: guild.icon,
        ownerId: guild.ownerId,
        systemChannelId: guild.systemChannelId,
        levelingEnabled: true,
        welcomeEnabled: false,
        automodEnabled: false,
        createdAt: new Date(),
      },
    });
    client.logs.info(`Added new guild ${guild.id} to database`);
  } else {
    const updates: Record<string, any> = {
      name: guild.name,
      icon: guild.icon,
      ownerId: guild.ownerId,
      systemChannelId: guild.systemChannelId,
      lastSeenAt: null,
    };

    await prisma.guild.update({
      where: { id: guild.id },
      data: updates,
    });
    client.logs.info(`Updated existing guild ${guild.id} in database`);
  }
};
