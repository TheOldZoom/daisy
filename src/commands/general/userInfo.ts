import { EmbedBuilder } from "discord.js";
import Command from "../../struct/Command";
import { getUserId } from "../../utils/getUserId";
import Colors from "../../utils/Colors";
import prisma from "../../struct/Prisma";
import userInfo from "../../inters/userInfo";

export default new Command({
  name: "userinfo",
  description: "Displays information about a user.",
  aliases: ["ui", "user", "u"],
  execute: async (message, args, client) => {
    const target = args[0]
      ? getUserId(args[0], message.guild)
      : message.author.id;

    if (!target) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.hotPinkPop)
            .setDescription(`The user was not found`),
        ],
      });
    }
    await message.reply(await userInfo(client, target));
  },
});
