import { EmbedBuilder, Message } from "discord.js";
import Command from "../../struct/Command";
import prisma from "../../struct/Prisma";
import Colors from "../../utils/Colors";

export default new Command({
  name: "prefix",
  description: "Set or remove the server prefix.",
  aliases: ["gp"],
  userPermissions: ["Administrator"],
  execute: async (message, args, client): Promise<void> => {
    const embed = new EmbedBuilder().setColor(Colors.sunshineYellow);
    const id = message.guild?.id;
    if (!id) return;

    const data = await prisma.guild.findFirst({
      where: { id },
    });

    if (data?.prefix) {
      embed.setDescription(
        `The prefix for this server is **\`${data.prefix}\`**.`
      );
    } else {
      embed
        .setDescription("This server does not have a custom prefix set.")
        .setColor(Colors.hotPinkPop);
    }

    await message.reply({ embeds: [embed] });
  },
  subs: [
    {
      name: "set",
      description: "Set a custom prefix for the server.",
      execute: async (message, args, client): Promise<void> => {
        const embed = new EmbedBuilder().setColor(Colors.sunshineYellow);
        const id = message.guild?.id;
        if (!id) return;
        const prefix = args[0];

        if (!prefix) {
          embed.setDescription("Please provide a prefix to set.");
          await message.reply({ embeds: [embed] });
          return;
        }

        if (prefix.length > 3) {
          embed.setDescription(
            "The prefix must not be longer than 3 characters."
          );
          await message.reply({ embeds: [embed] });
          return;
        }
        await prisma.guild.upsert({
          where: { id },
          update: { prefix },
          create: { id, prefix },
        });

        client.prefixes.set(id, prefix);
        embed.setDescription(
          `The prefix for this server has been set to \`${prefix}\`.`
        );
        await message.reply({ embeds: [embed] });
      },
    },
    {
      name: "remove",
      description: "Remove the custom prefix for the server.",
      execute: async (message, args, client): Promise<void> => {
        const embed = new EmbedBuilder().setColor(Colors.sunshineYellow);
        const id = message.guild?.id;
        if (!id) return;

        await prisma.guild.update({
          where: { id },
          data: { prefix: null },
        });

        client.prefixes.delete(id);
        embed.setDescription("The prefix for this server has been removed.");
        await message.reply({ embeds: [embed] });
      },
    },
  ],
});
