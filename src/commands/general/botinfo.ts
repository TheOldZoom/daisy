import { EmbedBuilder } from "discord.js";
import Command from "../../struct/Command";
import Colors from "../../utils/Colors";
import commas from "../../utils/commas";
import prisma from "../../struct/Prisma";

export default new Command({
  name: "botinfo",
  description: "Displays information about the bot.",
  aliases: ["bi", "info"],
  execute: async (message, args, client) => {
    const totalGuilds = client.guilds.cache.size;
    const totalUsers = client.guilds.cache.reduce(
      (acc, guild) => acc + guild.memberCount,
      0
    );
    const totalChannels = client.channels.cache.size;
    const uptime = `<t:${Math.floor((Date.now() - client.uptime!) / 1000)}:R>`;
    const totalCommands = client.commands.size;
    const totalEvents = client.events.size;

    const mostUsedPrefix = await prisma.guild.findFirst({
      where: { prefix: { not: null } },
      orderBy: { id: "asc" },
      select: { prefix: true },
    });

    const totalUsersInDB = await prisma.user.count();

    const description = `
👤 **Users**: ${commas(totalUsers)} (${commas(totalUsersInDB)} in db)
🌐 **Servers**: ${commas(totalGuilds)} 
💬 **Channels**: ${commas(totalChannels)}
📜 **Commands**: ${commas(totalCommands)}
⚙️ **Events**: ${commas(totalEvents)}
⏱️ **Uptime**: ${uptime}
🔑 **Most Used Self Prefix**: ${mostUsedPrefix?.prefix || "d."}
`;

    const embed = new EmbedBuilder()
      .setColor(Colors.sunshineYellow)
      .setTitle(`${client.user?.username} Information`)
      .setThumbnail(client.user?.displayAvatarURL({ size: 1024 }) || "")
      .setDescription(description)
      .setFooter({
        text: `Tracked Events Per Minute: ${commas(client.eventPerMinutes())}`,
      });

    await message.reply({ embeds: [embed] });
  },
});
