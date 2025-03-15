import { EmbedBuilder, Message } from "discord.js";
import Command from "../../struct/Command";
import prisma from "../../struct/Prisma";
import Colors from "../../utils/Colors";
import { getUserId } from "../../utils/getUserId";

export default new Command({
  name: "blacklist",
  description: "Manage the blacklist for users.",
  aliases: ["bl"],
  devOnly: true,
  execute: async (message, args, client): Promise<void> => {
    const embed = new EmbedBuilder().setColor(Colors.sunshineYellow);
    embed.setDescription("Please specify a subcommand: `add` or `remove`.");
    await message.reply({ embeds: [embed] });
  },
  subs: [
    {
      name: "add",
      description: "Add a user to the blacklist.",
      execute: async (message, args, client): Promise<void> => {
        const embed = new EmbedBuilder().setColor(Colors.sunshineYellow);

        const userId = await getUserId(args[0], message.guild);

        if (!userId) {
          embed.setDescription("Could not find this user");
          await message.reply({ embeds: [embed] });
          return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
          embed.setDescription("User not found in the database.");
          await message.reply({ embeds: [embed] });
          return;
        }

        await prisma.user.update({
          where: { id: userId },
          data: { blacklistedSince: new Date() },
        });
        client.blacklists.set(userId, new Date());
        embed.setDescription(`User <@${userId}> has been blacklisted.`);
        await message.reply({ embeds: [embed] });
      },
    },
    {
      name: "remove",
      description: "Remove a user from the blacklist.",
      execute: async (message, args, client): Promise<void> => {
        const embed = new EmbedBuilder().setColor(Colors.sunshineYellow);

        const userId = await getUserId(args[0]);

        if (!userId) {
          embed.setDescription("Please provide a user ID.");
          await message.reply({ embeds: [embed] });
          return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
          embed.setDescription("User not found in the database.");
          await message.reply({ embeds: [embed] });
          return;
        }

        await prisma.user.update({
          where: { id: userId },
          data: { blacklistedSince: null },
        });
        client.blacklists.delete(userId);
        embed.setDescription(
          `User <@${userId}> has been removed from the blacklist.`
        );
        await message.reply({ embeds: [embed] });
      },
    },
  ],
});
